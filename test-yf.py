import yfinance as yf
import requests

session = requests.Session()
# yfinance >0.2.x supports passing a session, but how does it handle timeouts if session.get happens?
# session.request does not store a default timeout. To enforce a global timeout, we must use HTTPAdapter or patch requests.
