"""Tests for backend/config.py: LOG_LEVEL from env."""

import logging
import os
from unittest.mock import patch

import pytest


def test_log_level_from_env_valid_log_level():
    """LOG_LEVEL env returns corresponding level when DEBUG/INFO/WARNING/ERROR/CRITICAL."""
    from backend import config
    with patch.dict(os.environ, {'LOG_LEVEL': 'WARNING'}):
        level = config._log_level_from_env()
    assert level == logging.WARNING


def test_log_level_from_env_production():
    """FLASK_ENV=production yields WARNING when LOG_LEVEL not set or invalid."""
    from backend import config
    with patch.dict(os.environ, {'LOG_LEVEL': 'INVALID', 'FLASK_ENV': 'production'}):
        level = config._log_level_from_env()
    assert level == logging.WARNING
