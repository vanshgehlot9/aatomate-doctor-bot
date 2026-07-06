from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization
import os

def generate_keys():
    print("Generating WhatsApp Flow RSA Key Pair...")
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
    )

    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )

    public_key = private_key.public_key()
    public_pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )

    with open("private.pem", "wb") as f:
        f.write(private_pem)
        
    with open("public.pem", "wb") as f:
        f.write(public_pem)
        
    print("Keys generated successfully!")
    print("-> private.pem")
    print("-> public.pem\n")
    
    print("--- HOW TO USE THESE KEYS ---")
    print("1. Open public.pem and copy its contents. Paste it into the WhatsApp Developer Portal under 'Flows' -> 'Endpoint' -> 'Public Key'.")
    print("2. Open private.pem and copy its contents. Paste it into your Render Dashboard as a new Environment Variable named: WHATSAPP_PRIVATE_KEY")

if __name__ == "__main__":
    generate_keys()
