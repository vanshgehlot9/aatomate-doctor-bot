"use server";

import jwt from "jsonwebtoken";
import { createClient } from "@supabase/supabase-js";

// Admin client uses service_role key — bypasses RLS and does NOT send confirmation emails
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!serviceKey || serviceKey === "YOUR_SERVICE_ROLE_KEY_HERE") {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set.");
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

// Called after Google OAuth — the Supabase user already exists, just create the hospital records
export async function registerHospitalForGoogleUser(
  userId: string,
  userEmail: string,
  userName: string,
  formData: any,
  token: string
) {
  try {
    const secret = process.env.ONBOARDING_JWT_SECRET || "fallback_secret_for_dev_only";
    let paymentData: any;
    try {
      paymentData = jwt.verify(token, secret);
    } catch (e) {
      return { error: "Invalid or expired onboarding session." };
    }

    const adminClient = getAdminClient();

    // Prevent double registration
    const { data: existingSub } = await adminClient
      .from("subscriptions")
      .select("id")
      .eq("payment_reference", paymentData.payment_id)
      .maybeSingle();

    if (existingSub) {
      return { error: "This payment has already been used to create an account." };
    }

    // Check if user already has a profile (in case they navigated back)
    const { data: existingUser } = await adminClient
      .from("users")
      .select("id, tenant_id")
      .eq("id", userId)
      .maybeSingle();

    if (existingUser?.tenant_id) {
      return { success: true }; // Already registered, just redirect
    }

    // Create Tenant Record (Hospital)
    const { data: tenant, error: tenantError } = await adminClient
      .from("tenants")
      .insert({
        name: formData.hospitalName,
        hospital_name: formData.hospitalName,
        email: formData.hospitalEmail,
        phone_number: formData.hospitalPhone,
        address: `${formData.addressLine1}, ${formData.addressLine2 || ""}, ${formData.city}, ${formData.state} ${formData.pincode}`,
        clinic_address: `${formData.addressLine1}, ${formData.city}`,
        is_active: true
      })
      .select()
      .single();

    if (tenantError || !tenant) {
      return { error: "Failed to create hospital record." };
    }

    // Update Google user's metadata with role
    await adminClient.auth.admin.updateUserById(userId, {
      user_metadata: { full_name: formData.adminName || userName, role: "hospital_admin" }
    });

    // Create or update user profile
    await adminClient.from("users").upsert({
      id: userId,
      tenant_id: tenant.id,
      name: formData.adminName || userName,
      email: userEmail,
      role: "hospital_admin",
    });

    // Create Subscription
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    await adminClient.from("subscriptions").insert({
      tenant_id: tenant.id,
      plan_name: paymentData.plan_name,
      monthly_price: paymentData.monthly_price,
      setup_fee: paymentData.setup_fee,
      status: "active",
      billing_cycle: "monthly",
      start_date: today.toISOString(),
      renewal_date: nextMonth.toISOString(),
      payment_reference: paymentData.payment_id,
      order_id: paymentData.order_id
    });

    // Create Tenant Settings
    await adminClient.from("tenant_settings").insert({
      tenant_id: tenant.id,
      setup_completed: false,
      whatsapp_connected: false,
      notification_preferences: { email: true, sms: false, whatsapp: true }
    });

    console.log(`Hospital registered via Google: ${formData.hospitalName}, Admin: ${userEmail}`);
    return { success: true };
  } catch (error: any) {
    console.error("Google Registration Error:", error);
    return { error: error.message || "An unexpected error occurred." };
  }
}


export async function registerHospital(formData: any, token: string) {
  try {
    // 1. Verify token on the server
    const secret = process.env.ONBOARDING_JWT_SECRET || "fallback_secret_for_dev_only";
    let paymentData: any;
    try {
      paymentData = jwt.verify(token, secret);
    } catch (e) {
      return { error: "Invalid or expired onboarding session." };
    }

    const adminClient = getAdminClient();

    // 2. Ensure payment not already used
    const { data: existingSub } = await adminClient
      .from("subscriptions")
      .select("id")
      .eq("payment_reference", paymentData.payment_id)
      .maybeSingle();

    if (existingSub) {
      return { error: "This payment has already been used to create an account." };
    }

    // 3. Create Auth User using admin.createUser — NO confirmation email is sent.
    //    The user's password is set directly so they can log in immediately.
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: formData.email,
      password: formData.password,
      email_confirm: true, // Bypass email verification — account is immediately active
      user_metadata: {
        full_name: formData.adminName,
        role: "hospital_admin"
      }
    });

    if (authError || !authData.user) {
      return { error: authError?.message || "Failed to create authentication user." };
    }

    const userId = authData.user.id;

    // 4. Create Tenant Record (Hospital)
    const { data: tenant, error: tenantError } = await adminClient
      .from("tenants")
      .insert({
        name: formData.hospitalName,
        hospital_name: formData.hospitalName,
        email: formData.hospitalEmail,
        phone_number: formData.hospitalPhone,
        address: `${formData.addressLine1}, ${formData.addressLine2}, ${formData.city}, ${formData.state} ${formData.pincode}`,
        clinic_address: `${formData.addressLine1}, ${formData.city}`,
        is_active: true
      })
      .select()
      .single();

    if (tenantError || !tenant) {
      // Rollback: delete the created auth user
      await adminClient.auth.admin.deleteUser(userId);
      return { error: "Failed to create hospital record." };
    }

    // 5. Create Admin User Profile linked to Tenant
    const { error: userInsertError } = await adminClient.from("users").insert({
      id: userId,
      tenant_id: tenant.id,
      name: formData.adminName,
      email: formData.email,
      role: "hospital_admin",
    });

    if (userInsertError) {
      await adminClient.auth.admin.deleteUser(userId);
      return { error: "Failed to create user profile." };
    }

    // 6. Create Subscription
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    await adminClient.from("subscriptions").insert({
      tenant_id: tenant.id,
      plan_name: paymentData.plan_name,
      monthly_price: paymentData.monthly_price,
      setup_fee: paymentData.setup_fee,
      status: "active",
      billing_cycle: "monthly",
      start_date: today.toISOString(),
      renewal_date: nextMonth.toISOString(),
      payment_reference: paymentData.payment_id,
      order_id: paymentData.order_id
    });

    // 7. Create Tenant Settings (Default)
    await adminClient.from("tenant_settings").insert({
      tenant_id: tenant.id,
      setup_completed: false,
      whatsapp_connected: false,
      notification_preferences: {
        email: true,
        sms: false,
        whatsapp: true
      }
    });

    console.log(`Hospital registered: ${formData.hospitalName}, Admin: ${formData.email}`);

    return { success: true };
  } catch (error: any) {
    console.error("Registration Error:", error);
    return { error: error.message || "An unexpected error occurred during onboarding." };
  }
}
