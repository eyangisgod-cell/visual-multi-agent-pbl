"""
Cryptography Utilities for Visual PBL

Provides secure encryption and hashing for sensitive data:
- Password hashing using bcrypt
- Data encryption/decryption using Fernet (AES)
- Secure token generation
"""

import bcrypt
import base64
import hashlib
import secrets
from typing import Optional
from cryptography.fernet import Fernet
from app.config import settings


def hash_password(password: str, salt_rounds: int = 12) -> str:
    """
    Hash a password using bcrypt.

    Args:
        password: Plain text password to hash
        salt_rounds: Number of salt rounds (default 12 for K12 security)

    Returns:
        Hashed password string
    """
    if not isinstance(password, str):
        raise TypeError("Password must be a string")

    # Generate salt and hash
    salt = bcrypt.gensalt(rounds=salt_rounds)
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)

    return hashed.decode('utf-8')


def verify_password(password: str, hashed_password: str) -> bool:
    """
    Verify a password against a hash.

    Args:
        password: Plain text password to verify
        hashed_password: Previously hashed password

    Returns:
        True if password matches, False otherwise
    """
    try:
        return bcrypt.checkpw(
            password.encode('utf-8'),
            hashed_password.encode('utf-8')
        )
    except (ValueError, AttributeError):
        return False


def generate_encryption_key() -> bytes:
    """
    Generate a new Fernet encryption key.

    Returns:
        32-byte URL-safe base64-encoded key
    """
    return Fernet.generate_key()


def get_fernet() -> Fernet:
    """
    Get Fernet instance for encryption/decryption.
    Uses ENCRYPTION_KEY from settings or generates one.

    Returns:
        Fernet instance
    """
    # Get key from settings or use default (for dev only)
    key = getattr(settings, 'ENCRYPTION_KEY', None)

    if not key:
        # Generate a key for development (in production, this should be from env)
        key = generate_encryption_key().decode('utf-8')

    # Ensure key is properly formatted
    if isinstance(key, str):
        key = key.encode('utf-8')

    return Fernet(key)


def encrypt_data(data: str) -> str:
    """
    Encrypt sensitive data using Fernet (AES-128-CBC).

    Args:
        data: Plain text data to encrypt

    Returns:
        Base64-encoded encrypted data
    """
    if not isinstance(data, str):
        raise TypeError("Data must be a string")

    fernet = get_fernet()
    encrypted = fernet.encrypt(data.encode('utf-8'))

    return base64.urlsafe_b64encode(encrypted).decode('utf-8')


def decrypt_data(encrypted_data: str) -> str:
    """
    Decrypt data encrypted with encrypt_data.

    Args:
        encrypted_data: Base64-encoded encrypted data

    Returns:
        Decrypted plain text data
    """
    try:
        fernet = get_fernet()
        decoded = base64.urlsafe_b64decode(encrypted_data.encode('utf-8'))
        decrypted = fernet.decrypt(decoded)

        return decrypted.decode('utf-8')
    except Exception as e:
        raise ValueError(f"Failed to decrypt data: {str(e)}")


def generate_secure_token(length: int = 32) -> str:
    """
    Generate a cryptographically secure random token.

    Args:
        length: Length of token in bytes (default 32)

    Returns:
        Hex-encoded secure token
    """
    return secrets.token_hex(length)


def hash_data(data: str, salt: Optional[str] = None) -> str:
    """
    Create a SHA-256 hash of data with optional salt.

    Args:
        data: Data to hash
        salt: Optional salt for additional security

    Returns:
        Hex-encoded hash
    """
    salted_data = (salt or '') + data + (salt or '')
    hashed = hashlib.sha256(salted_data.encode('utf-8')).hexdigest()

    return hashed


def mask_sensitive_data(data: str, visible_chars: int = 4) -> str:
    """
    Mask sensitive data for display (e.g., API keys, tokens).

    Args:
        data: Sensitive data to mask
        visible_chars: Number of characters to show at start and end

    Returns:
        Masked string (e.g., "abc12***xyz")
    """
    if len(data) <= visible_chars * 2:
        return '*' * len(data)

    return f"{data[:visible_chars]}{'*' * (len(data) - visible_chars * 2)}{data[-visible_chars:]}"


class DataEncryption:
    """
    High-level data encryption service for sensitive fields.

    Usage:
        encryption = DataEncryption()
        encrypted = encryption.encrypt("sensitive data")
        decrypted = encryption.decrypt(encrypted)
    """

    def __init__(self, key: Optional[str] = None):
        """
        Initialize encryption service.

        Args:
            key: Optional encryption key (uses settings if not provided)
        """
        self._fernet = get_fernet() if not key else Fernet(key.encode('utf-8'))

    def encrypt(self, data: str) -> str:
        """Encrypt data."""
        encrypted = self._fernet.encrypt(data.encode('utf-8'))
        return base64.urlsafe_b64encode(encrypted).decode('utf-8')

    def decrypt(self, encrypted_data: str) -> str:
        """Decrypt data."""
        try:
            decoded = base64.urlsafe_b64decode(encrypted_data.encode('utf-8'))
            decrypted = self._fernet.decrypt(decoded)
            return decrypted.decode('utf-8')
        except Exception as e:
            raise ValueError(f"Decryption failed: {str(e)}")

    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password using bcrypt."""
        return hash_password(password)

    @staticmethod
    def verify_password(password: str, hashed: str) -> bool:
        """Verify password against hash."""
        return verify_password(password, hashed)
