"""
Cryptography Tests for Visual PBL

Tests for:
- Password hashing with bcrypt
- Data encryption/decryption
- Secure token generation
- Data masking
"""

import pytest
from app.utils.crypto import (
    hash_password,
    verify_password,
    encrypt_data,
    decrypt_data,
    generate_secure_token,
    hash_data,
    mask_sensitive_data,
    DataEncryption
)


class TestPasswordHashing:
    """Tests for bcrypt password hashing."""

    def test_hash_password_returns_string(self):
        """Test that hash_password returns a string."""
        result = hash_password("test_password123")
        assert isinstance(result, str)
        assert len(result) > 0

    def test_hash_password_different_salts(self):
        """Test that same password produces different hashes."""
        password = "test_password123"
        hash1 = hash_password(password)
        hash2 = hash_password(password)

        # Bcrypt uses random salt, so hashes should be different
        assert hash1 != hash2

    def test_verify_password_correct(self):
        """Test that correct password verifies."""
        password = "test_password123"
        hashed = hash_password(password)

        assert verify_password(password, hashed) is True

    def test_verify_password_incorrect(self):
        """Test that incorrect password fails verification."""
        password = "test_password123"
        wrong_password = "wrong_password"
        hashed = hash_password(password)

        assert verify_password(wrong_password, hashed) is False

    def test_verify_password_empty(self):
        """Test that empty password is handled."""
        hashed = hash_password("test_password")

        assert verify_password("", hashed) is False

    def test_verify_password_invalid_hash(self):
        """Test that invalid hash format is handled safely."""
        assert verify_password("password", "invalid_hash") is False
        assert verify_password("password", "") is False

    def test_hash_password_special_characters(self):
        """Test hashing passwords with special characters."""
        password = "p@$$w0rd!#$%^&*()_+{}|:<>?"
        hashed = hash_password(password)

        assert verify_password(password, hashed) is True

    def test_hash_password_unicode(self):
        """Test hashing passwords with unicode characters."""
        password = "密码 123/password"
        hashed = hash_password(password)

        assert verify_password(password, hashed) is True

    def test_hash_password_long_password(self):
        """Test hashing very long passwords."""
        password = "a" * 1000
        hashed = hash_password(password)

        assert verify_password(password, hashed) is True

    def test_hash_password_non_string_raises_error(self):
        """Test that non-string password raises TypeError."""
        with pytest.raises(TypeError):
            hash_password(123)  # type: ignore


class TestDataEncryption:
    """Tests for data encryption/decryption."""

    def test_encrypt_decrypt_roundtrip(self):
        """Test that encrypted data can be decrypted."""
        original = "sensitive data to encrypt"
        encrypted = encrypt_data(original)
        decrypted = decrypt_data(encrypted)

        assert decrypted == original

    def test_encrypt_produces_different_output(self):
        """Test that same data produces different encrypted output."""
        data = "same data"
        encrypted1 = encrypt_data(data)
        encrypted2 = encrypt_data(data)

        # Encryption includes random IV, so output should differ
        assert encrypted1 != encrypted2
        assert decrypt_data(encrypted1) == data
        assert decrypt_data(encrypted2) == data

    def test_decrypt_invalid_data_raises_error(self):
        """Test that invalid encrypted data raises ValueError."""
        with pytest.raises(ValueError):
            decrypt_data("invalid_encrypted_data")

    def test_decrypt_empty_string_raises_error(self):
        """Test that empty string raises error."""
        with pytest.raises(ValueError):
            decrypt_data("")

    def test_encrypt_empty_string(self):
        """Test encrypting empty string."""
        encrypted = encrypt_data("")
        decrypted = decrypt_data(encrypted)

        assert decrypted == ""

    def test_encrypt_unicode(self):
        """Test encrypting unicode characters."""
        original = "中文 测试 数据 123"
        encrypted = encrypt_data(original)
        decrypted = decrypt_data(encrypted)

        assert decrypted == original

    def test_encrypt_large_data(self):
        """Test encrypting large data."""
        original = "x" * 10000
        encrypted = encrypt_data(original)
        decrypted = decrypt_data(encrypted)

        assert decrypted == original


class TestSecureTokenGeneration:
    """Tests for secure token generation."""

    def test_generate_secure_token_returns_string(self):
        """Test that token generation returns string."""
        token = generate_secure_token()
        assert isinstance(token, str)

    def test_generate_secure_token_length(self):
        """Test token length is correct."""
        token = generate_secure_token(32)
        # Hex encoding doubles the length
        assert len(token) == 64

    def test_generate_secure_token_unique(self):
        """Test that generated tokens are unique."""
        tokens = [generate_secure_token() for _ in range(100)]
        assert len(set(tokens)) == 100

    def test_generate_secure_token_hex_format(self):
        """Test that token is valid hex."""
        token = generate_secure_token()
        try:
            int(token, 16)
        except ValueError:
            pytest.fail("Token is not valid hex")

    def test_generate_secure_token_custom_length(self):
        """Test custom token length."""
        token = generate_secure_token(16)
        assert len(token) == 32  # Hex doubles length

        token = generate_secure_token(64)
        assert len(token) == 128


class TestHashData:
    """Tests for SHA-256 data hashing."""

    def test_hash_data_returns_string(self):
        """Test that hash_data returns hex string."""
        result = hash_data("test data")
        assert isinstance(result, str)
        assert len(result) == 64  # SHA-256 produces 64 hex chars

    def test_hash_data_consistent(self):
        """Test that same data produces same hash."""
        data = "test data"
        hash1 = hash_data(data)
        hash2 = hash_data(data)

        assert hash1 == hash2

    def test_hash_data_different_inputs(self):
        """Test that different data produces different hash."""
        hash1 = hash_data("data1")
        hash2 = hash_data("data2")

        assert hash1 != hash2

    def test_hash_data_with_salt(self):
        """Test hashing with salt."""
        data = "test data"
        salt = "my_salt"

        hash_unsalted = hash_data(data)
        hash_salted = hash_data(data, salt)

        assert hash_unsalted != hash_salted

    def test_hash_data_same_salt_consistent(self):
        """Test same salt produces same hash."""
        data = "test data"
        salt = "my_salt"

        hash1 = hash_data(data, salt)
        hash2 = hash_data(data, salt)

        assert hash1 == hash2


class TestMaskSensitiveData:
    """Tests for sensitive data masking."""

    def test_mask_short_string(self):
        """Test masking short string."""
        result = mask_sensitive_data("abc")
        assert all(c == '*' for c in result)

    def test_mask_medium_string(self):
        """Test masking medium string."""
        data = "abcdef123456"
        result = mask_sensitive_data(data)

        assert result.startswith(data[:4])
        assert result.endswith(data[-4:])
        assert '*' in result

    def test_mask_long_string(self):
        """Test masking long string."""
        data = "very_long_sensitive_data_string"
        result = mask_sensitive_data(data)

        assert result.startswith(data[:4])
        assert result.endswith(data[-4:])
        assert len(result) == len(data)

    def test_mask_api_key_format(self):
        """Test masking API key format."""
        api_key = "sk-1234567890abcdefghijklmnop"
        masked = mask_sensitive_data(api_key)

        assert masked.startswith("sk-1")
        assert '*' in masked


class TestDataEncryptionClass:
    """Tests for DataEncryption class."""

    def test_data_encryption_encrypt_decrypt(self):
        """Test DataEncryption encrypt/decrypt."""
        encryption = DataEncryption()
        original = "test data"

        encrypted = encryption.encrypt(original)
        decrypted = encryption.decrypt(encrypted)

        assert decrypted == original

    def test_data_encryption_hash_password(self):
        """Test DataEncryption.hash_password."""
        password = "test_password"
        hashed = DataEncryption.hash_password(password)

        assert DataEncryption.verify_password(password, hashed) is True
        assert DataEncryption.verify_password("wrong", hashed) is False

    def test_data_encryption_invalid_decrypt(self):
        """Test DataEncryption decrypt with invalid data."""
        encryption = DataEncryption()

        with pytest.raises(ValueError):
            encryption.decrypt("invalid_data")


class TestEncryptionIntegration:
    """Integration tests for encryption system."""

    def test_password_storage_workflow(self):
        """Test complete password storage workflow."""
        # User registration
        password = "user_password123"
        stored_hash = hash_password(password)

        # User login - correct password
        assert verify_password(password, stored_hash) is True

        # User login - wrong password
        assert verify_password("wrong_password", stored_hash) is False

    def test_sensitive_data_storage_workflow(self):
        """Test complete sensitive data storage workflow."""
        # Store sensitive data
        secret = "API_KEY_12345_SECRET"
        encrypted = encrypt_data(secret)

        # Verify encrypted data is different from original
        assert encrypted != secret

        # Retrieve sensitive data
        decrypted = decrypt_data(encrypted)

        assert decrypted == secret

    def test_token_for_session_workflow(self):
        """Test secure token for session workflow."""
        # Generate session token
        token = generate_secure_token(32)

        # Verify token format
        assert len(token) == 64
        assert all(c in '0123456789abcdef' for c in token)

        # Verify uniqueness
        token2 = generate_secure_token(32)
        assert token != token2
