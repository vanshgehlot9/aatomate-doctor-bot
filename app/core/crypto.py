"""
WhatsApp Flow Cryptography Module — Multi-Key Keyring
=======================================================
CORE DESIGN: When you rotate keys, Meta's CDN still serves the OLD public key
for up to 30-60 minutes. During this window decryption fails because your server
has the NEW private key. Fix: keep a keyring of the last N private keys and try
each one on every decryption attempt (newest first). The winning key is used to
encrypt the response. This gives zero-downtime key rotation.

Protocol facts:
- Meta encrypts an AES-256 key with your RSA-2048 public key (OAEP / SHA-256)
- The flow data is encrypted with that AES key using AES-256-GCM
- On response, the IV is bitwise-flipped before re-encrypting
"""

import os, glob, json, shutil, hashlib, logging
from base64 import b64decode, b64encode
from datetime import datetime
from typing import Tuple, Any, Dict, List, Optional

from cryptography.hazmat.primitives.asymmetric.padding import OAEP, MGF1
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.ciphers import algorithms, Cipher, modes
from cryptography.hazmat.primitives.serialization import load_pem_private_key

logger = logging.getLogger(__name__)

_ROOT            = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PRIVATE_KEY_PATH = os.path.join(_ROOT, "private.pem")
PUBLIC_KEY_PATH  = os.path.join(_ROOT, "public.pem")
KEY_ARCHIVE_DIR  = os.path.join(_ROOT, "key_archive")
MAX_KEYS         = 5

_keyring: List[Tuple[Any, str]] = []
_keyring_loaded = False


def _fp(key_obj) -> str:
    der = key_obj.public_key().public_bytes(
        serialization.Encoding.DER, serialization.PublicFormat.SubjectPublicKeyInfo)
    return hashlib.sha256(der).hexdigest()[:16]


def _load_key(path: str):
    try:
        with open(path, "rb") as fh:
            return load_pem_private_key(fh.read(), password=None)
    except Exception as e:
        logger.warning(f"[crypto] Could not load key from {path}: {e}")
        return None


def _build_keyring() -> List[Tuple[Any, str]]:
    ring: List[Tuple[Any, str]] = []
    if os.path.exists(PRIVATE_KEY_PATH):
        k = _load_key(PRIVATE_KEY_PATH)
        if k:
            ring.append((k, _fp(k)))
            logger.info(f"[crypto] Loaded current key fp={ring[-1][1]}")
    if os.path.isdir(KEY_ARCHIVE_DIR):
        for path in sorted(glob.glob(os.path.join(KEY_ARCHIVE_DIR, "private_*.pem")), reverse=True):
            if len(ring) >= MAX_KEYS:
                break
            k = _load_key(path)
            if k:
                fp = _fp(k)
                if not any(efp == fp for _, efp in ring):
                    ring.append((k, fp))
                    logger.info(f"[crypto] Loaded archived key fp={fp} ({os.path.basename(path)})")
    if not ring:
        raise FileNotFoundError(
            f"No usable private keys in {PRIVATE_KEY_PATH!r} or {KEY_ARCHIVE_DIR!r}. "
            "Run: python sync_keys.py")
    logger.info(f"[crypto] Keyring ready — {len(ring)} key(s) available.")
    return ring


def _get_keyring():
    global _keyring, _keyring_loaded
    if not _keyring_loaded:
        _keyring = _build_keyring()
        _keyring_loaded = True
    return _keyring


def invalidate_key_cache():
    global _keyring, _keyring_loaded
    _keyring, _keyring_loaded = [], False
    logger.info("[crypto] Key cache invalidated.")


def get_public_key_fingerprint() -> Optional[str]:
    try:
        r = _get_keyring()
        return r[0][1] if r else None
    except Exception:
        return None


def get_keyring_status() -> Dict[str, Any]:
    try:
        ring = _get_keyring()
        return {
            "key_count": len(ring),
            "keys": [{"slot": i, "fingerprint": fp,
                       "role": "current" if i == 0 else "fallback"}
                     for i, (_, fp) in enumerate(ring)],
        }
    except Exception as e:
        return {"key_count": 0, "error": str(e)}


def archive_current_key():
    if not os.path.exists(PRIVATE_KEY_PATH):
        return
    os.makedirs(KEY_ARCHIVE_DIR, exist_ok=True)
    ts   = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    dest = os.path.join(KEY_ARCHIVE_DIR, f"private_{ts}.pem")
    shutil.copy2(PRIVATE_KEY_PATH, dest)
    logger.info(f"[crypto] Archived current key -> {dest}")
    for old in sorted(glob.glob(os.path.join(KEY_ARCHIVE_DIR, "private_*.pem")), reverse=True)[MAX_KEYS - 1:]:
        try:
            os.remove(old)
        except Exception:
            pass


def load_private_key():
    try:
        r = _get_keyring()
        return r[0][0] if r else None
    except Exception:
        return None


def _safe_b64decode(v: str) -> bytes:
    v = v.replace("-", "+").replace("_", "/")
    v += "=" * ((-len(v)) % 4)
    return b64decode(v)


def _try_rsa_decrypt(key, ciphertext: bytes) -> Optional[bytes]:
    try:
        return key.decrypt(ciphertext,
            OAEP(mgf=MGF1(algorithm=hashes.SHA256()), algorithm=hashes.SHA256(), label=None))
    except ValueError:
        return None


def decrypt_whatsapp_flow_request(
    encrypted_aes_key_b64: str,
    encrypted_flow_data_b64: str,
    initial_vector_b64: str,
) -> Tuple[Dict[str, Any], bytes, bytes]:
    """
    Decrypt a WhatsApp Flows encrypted request using the multi-key keyring.
    Tries the current key first, then falls back to archived keys automatically.
    This transparently handles Meta CDN propagation delay after key rotation.
    """
    try:
        enc_aes_key  = _safe_b64decode(encrypted_aes_key_b64)
        enc_flow     = _safe_b64decode(encrypted_flow_data_b64)
        iv           = _safe_b64decode(initial_vector_b64)
    except Exception as exc:
        raise ValueError(f"Base64 decode failed: {exc}") from exc

    # RSA-2048 requires exactly 256-byte ciphertext. Anything else is a stale
    # WhatsApp message cached before a key rotation — it can never be decrypted.
    if len(enc_aes_key) != 256:
        raise ValueError(
            f"Stale cached request (AES key = {len(enc_aes_key)} bytes, expected 256). "
            f"This WhatsApp message was sent before the last key rotation. "
            f"It cannot be decrypted — safe to ignore."
        )

    ring = _get_keyring()
    aes_key, winning_fp = None, None
    for key_obj, fp in ring:
        result = _try_rsa_decrypt(key_obj, enc_aes_key)
        if result is not None:
            aes_key, winning_fp = result, fp
            break

    if aes_key is None:
        tried = [fp for _, fp in ring]
        raise ValueError(
            f"RSA decryption failed with all {len(ring)} key(s) in the keyring. "
            f"Tried: {tried}. If this persists run: python sync_keys.py")

    if winning_fp != ring[0][1]:
        logger.warning(
            f"[crypto] Decrypted using FALLBACK key fp={winning_fp} "
            f"(current fp={ring[0][1]}) — Meta CDN propagation still in progress.")
    else:
        logger.debug(f"[crypto] Decrypted with current key fp={winning_fp}.")

    if len(enc_flow) < 16:
        raise ValueError("Encrypted flow data too short.")
    ciphertext, gcm_tag = enc_flow[:-16], enc_flow[-16:]

    try:
        dec = Cipher(algorithms.AES(aes_key), modes.GCM(iv, gcm_tag)).decryptor()
        plaintext = dec.update(ciphertext) + dec.finalize()
    except Exception as exc:
        raise ValueError(f"AES-GCM decryption failed: {exc}") from exc

    try:
        body = json.loads(plaintext.decode("utf-8"))
    except Exception as exc:
        raise ValueError(f"Decrypted payload is not valid JSON: {exc}") from exc

    return body, aes_key, iv


def encrypt_whatsapp_flow_response(response: Dict[str, Any], aes_key: bytes, iv: bytes) -> str:
    """Encrypt a WhatsApp Flows response. IV is bitwise-flipped per Meta protocol."""
    flipped_iv = bytes(b ^ 0xFF for b in iv)
    data       = json.dumps(response, separators=(",", ":")).encode("utf-8")
    enc = Cipher(algorithms.AES(aes_key), modes.GCM(flipped_iv)).encryptor()
    ct  = enc.update(data) + enc.finalize()
    return b64encode(ct + enc.tag).decode("utf-8")
