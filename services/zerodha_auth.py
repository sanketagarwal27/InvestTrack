import os
from kiteconnect import KiteConnect

class ZerodhaAuth:
    def __init__(self):
        self.api_key    = os.environ.get('ZERODHA_API_KEY', '')
        self.api_secret = os.environ.get('ZERODHA_API_SECRET', '')
        self.kite       = KiteConnect(api_key=self.api_key)
        self.access_token = None

    def get_login_url(self):
        return self.kite.login_url()

    def generate_session(self, request_token):
        try:
            data = self.kite.generate_session(request_token,
                                              api_secret=self.api_secret)
            self.access_token = data["access_token"]
            self.kite.set_access_token(self.access_token)
            return self.access_token
        except Exception as e:
            print("Error generating session:", e)
            return None

    def set_access_token(self, access_token):
        """Allow reuse after reconnecting from session."""
        self.access_token = access_token
        self.kite.set_access_token(access_token)
