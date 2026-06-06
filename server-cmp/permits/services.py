import qrcode
from io import BytesIO
from django.conf import settings
from django.core.files.base import ContentFile
from PIL import Image


class QRCodeService:
    @staticmethod
    def generate_qr_code_url(permit_qr):
        """Generate URL for QR code"""
        # Prefer a dedicated public base if provided; otherwise use SERVER_URL
        base_url = getattr(settings, "QR_VERIFY_BASE_URL", settings.SERVER_URL).rstrip('/')
        # Use the short public route to avoid exposing API structure
        return f"{base_url}/v/{permit_qr.token}/"
    
    @staticmethod
    def create_qr_code_image(url, size=10):
        """Create QR code image"""
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=size,
            border=4,
        )
        qr.add_data(url)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        return img
    
    @staticmethod
    def generate_qr_code_for_permit(permit):
        """Generate QR code for a permit"""
        # Reuse active QR code if present to avoid rotating token
        qr_code = permit.active_qr_code or permit.generate_qr_code()
        url = QRCodeService.generate_qr_code_url(qr_code)
        img = QRCodeService.create_qr_code_image(url)
        
        # Convert to bytes
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        
        return buffer.getvalue() 