"""
Test Supabase Connection and User Status

This script tests:
1. Supabase connection
2. User exists in database
3. User email verification status
4. Password authentication
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add parent directory to path to import dependencies
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from supabase import create_client

# Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
TEST_EMAIL = "hrishikesh@eklabs.in"

def test_connection():
    """Test Supabase connection"""
    print("\n" + "="*60)
    print("TESTING SUPABASE CONNECTION")
    print("="*60)
    
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        print(f"✅ Connected to Supabase: {SUPABASE_URL}")
        return supabase
    except Exception as e:
        print(f"❌ Failed to connect: {e}")
        return None

def check_user_status(supabase, email):
    """Check if user exists and their verification status"""
    print("\n" + "="*60)
    print(f"CHECKING USER STATUS: {email}")
    print("="*60)
    
    try:
        # Use admin API to get user by email
        response = supabase.auth.admin.list_users()
        
        # Find user by email
        user = None
        for u in response:
            if u.email == email:
                user = u
                break
        
        if not user:
            print(f"❌ User NOT found in database")
            return None
        
        print(f"✅ User found in database")
        print(f"   User ID: {user.id}")
        print(f"   Email: {user.email}")
        print(f"   Email Confirmed: {'✅ YES' if user.email_confirmed_at else '❌ NO'}")
        print(f"   Email Confirmed At: {user.email_confirmed_at or 'Not confirmed'}")
        print(f"   Created At: {user.created_at}")
        print(f"   Last Sign In: {user.last_sign_in_at or 'Never'}")
        
        # Check metadata
        if user.user_metadata:
            print(f"\n   User Metadata:")
            print(f"      Name: {user.user_metadata.get('name', 'N/A')}")
            print(f"      Role: {user.user_metadata.get('role', 'N/A')}")
            print(f"      Department: {user.user_metadata.get('department', 'N/A')}")
        
        return user
        
    except Exception as e:
        print(f"❌ Error checking user: {e}")
        return None

def test_password_auth(supabase, email, password):
    """Test password authentication"""
    print("\n" + "="*60)
    print(f"TESTING PASSWORD AUTHENTICATION")
    print("="*60)
    
    try:
        response = supabase.auth.sign_in_with_password({
            "email": email,
            "password": password
        })
        
        if response.user:
            print(f"✅ Password authentication SUCCESSFUL")
            print(f"   User ID: {response.user.id}")
            print(f"   Email: {response.user.email}")
            print(f"   Email Verified: {'✅ YES' if response.user.email_confirmed_at else '❌ NO'}")
            return True
        else:
            print(f"❌ Password authentication FAILED - No user returned")
            return False
            
    except Exception as e:
        print(f"❌ Password authentication FAILED")
        print(f"   Error: {str(e)}")
        return False

def main():
    print("\n🔍 SUPABASE CONNECTION & USER STATUS TEST")
    print("=" * 60)
    
    # Test 1: Connection
    supabase = test_connection()
    if not supabase:
        print("\n❌ Cannot proceed without Supabase connection")
        return
    
    # Test 2: User Status
    user = check_user_status(supabase, TEST_EMAIL)
    
    # Test 3: Password Authentication (only if user exists)
    if user:
        print(f"\n💡 To test password authentication, update the password in the script")
        print(f"   Current password in script: <UPDATE_ME>")
        
        # Uncomment and set the correct password to test
        # test_password_auth(supabase, TEST_EMAIL, "YourActualPassword123!")
    
    # Summary
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    
    if not user:
        print("❌ User does not exist in Supabase")
        print("\n📝 SOLUTION:")
        print("   1. Complete signup flow in frontend")
        print("   2. Verify email with OTP")
        print("   3. Try login again")
    elif not user.email_confirmed_at:
        print("❌ User exists but email is NOT verified")
        print(f"\n📝 SOLUTION:")
        print(f"   Option 1 - Verify via Frontend:")
        print(f"      1. Go to signup page")
        print(f"      2. Use email: {TEST_EMAIL}")
        print(f"      3. Complete OTP verification")
        print(f"")
        print(f"   Option 2 - Manually verify in Supabase:")
        print(f"      1. Go to Supabase Dashboard")
        print(f"      2. Authentication > Users")
        print(f"      3. Find user: {TEST_EMAIL}")
        print(f"      4. Click '...' > Confirm email")
    else:
        print("✅ User exists and email is verified")
        print("\n📝 If login still fails:")
        print("   1. Check backend logs for specific error")
        print("   2. Verify password is correct")
        print("   3. Check session middleware is working")
        print("   4. Ensure frontend is calling /api/auth/signin (not /login)")

if __name__ == "__main__":
    main()
