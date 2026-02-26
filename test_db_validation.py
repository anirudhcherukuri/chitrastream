import unittest
from db import Database

class DatabaseUnitTests(unittest.TestCase):
    def setUp(self):
        self.db = Database()
        
    def test_email_validation(self):
        """Test the validate_email function limits and security"""
        # Valid cases
        self.assertTrue(self.db.validate_email("test@example.com"))
        self.assertTrue(self.db.validate_email("user.name+tag@domain.co.uk"))
        
        # Invalid cases
        self.assertFalse(self.db.validate_email("plainaddress"))
        self.assertFalse(self.db.validate_email("@missingusername.com"))
        self.assertFalse(self.db.validate_email("username@.com"))
        
        # Security cases
        self.assertFalse(self.db.validate_email("<script>@test.com"))
        self.assertFalse(self.db.validate_email("test@<img src=x onerror=alert(1)>.com"))

    def test_mobile_validation(self):
        """Test mobile number validation to prevent injection or invalid formats"""
        # Valid cases
        self.assertTrue(self.db.validate_mobile("1234567890"))
        self.assertTrue(self.db.validate_mobile("+1234567890"))
        self.assertTrue(self.db.validate_mobile("+919876543210"))
        
        # Invalid cases
        self.assertFalse(self.db.validate_mobile("phone_number")) # chars
        self.assertFalse(self.db.validate_mobile("123")) # too short
        self.assertFalse(self.db.validate_mobile("12345678901234567890")) # too long
        
        # Security case
        self.assertFalse(self.db.validate_mobile("1234567890; DROP TABLE Users;"))

    def test_password_hashing(self):
        """Verify that password hashing works and generates varied salts"""
        pwd1 = self.db.hash_password("password123")
        pwd2 = self.db.hash_password("password123")
        
        # Must not be equal because of unique salts
        self.assertNotEqual(pwd1, pwd2)
        
        # Verification should pass on both
        self.assertTrue(self.db.verify_password("password123", pwd1))
        self.assertTrue(self.db.verify_password("password123", pwd2))
        
        # Verification should fail on wrong password
        self.assertFalse(self.db.verify_password("wrongpassword", pwd1))

if __name__ == '__main__':
    unittest.main()
