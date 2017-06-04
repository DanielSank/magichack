import os

import MySQLdb
import sqlalchemy as sa
from sqlalchemy import MetaData
import sqlemon
import webapp2

import secrets


class MainPage(webapp2.RequestHandler):
    def get(self):
        production_mode = sqlemon.production_mode()
        self.response.headers['Content-Type'] = 'text/plain'
        url = sqlemon.get_sqlalchemy_url_for_server('magichack')
        self.response.write('Main page. Production mode: {}\nserver url: {}'.format(
            production_mode,
            url))


class DBConnectionSQLAlchemy(webapp2.RequestHandler):
    def get(self):
        url = sqlemon.get_sqlalchemy_url_for_server(
                'magichack',
                secrets.CLOUD_SQL_PASSWORD)
        engine = sa.create_engine(url, echo=False)
        metadata = MetaData()
        metadata.reflect(bind=engine)
        tables = '/n'.join([str(table) for table in metadata.sorted_tables])
        self.response.headers['Content-Type'] = 'text/plain'
        self.response.write('\n'.join(
            [url, 'The tables are {}'.format(tables)]))


app = webapp2.WSGIApplication(
        [('/main', MainPage),
         ('/sqlalchemy', DBConnectionSQLAlchemy)],
        debug=not sqlemon.production_mode())
