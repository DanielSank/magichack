import os

import jinja2
import MySQLdb
import sqlalchemy as sa
from sqlalchemy import MetaData
import sqlemon
import webapp2

import magichack.models as models
import magichack.secrets as secrets


JINJA_ENVIRONMENT = jinja2.Environment(
        loader=jinja2.FileSystemLoader(os.path.dirname(__file__)),
        extensions=['jinja2.ext.autoescape'],
        autoescape=True)

session_maker = sqlemon.get_sessionmaker(
        'magichack',
        secrets.CLOUD_SQL_PASSWORD)


class MainPage(webapp2.RequestHandler):
    def get(self):
        production_mode = sqlemon.production_mode()
        self.response.headers['Content-Type'] = 'text/plain'
        url = sqlemon.get_sqlalchemy_url_for_server('magichack')
        self.response.write('Main page. Production mode: {}\nserver url: {}'.format(
            production_mode,
            url))


class ShowCards(webapp2.RequestHandler):
    def get(self):
        session = session_maker()
        cards = session.query(models.Creature).all()
        template = JINJA_ENVIRONMENT.get_template('results.html')
        self.response.write(
                template.render({'cards': cards}))


class DBConnectionSQLAlchemy(webapp2.RequestHandler):
    def get(self):
        url = sqlemon.get_sqlalchemy_url_for_server(
                'magichack',
                secrets.CLOUD_SQL_PASSWORD)
        engine = sa.create_engine(url, echo=False)
        metadata = MetaData()
        metadata.reflect(bind=engine)
        tables = '\n  '.join([str(table) for table in metadata.sorted_tables])
        self.response.headers['Content-Type'] = 'text/plain'
        self.response.write('\n'.join(
            [url, 'The tables are {}'.format(tables)]))


app = webapp2.WSGIApplication(
        [
            ('/main', MainPage),
            ('/sqlalchemy', DBConnectionSQLAlchemy),
            ('/results', ShowCards),
        ],
        debug=not sqlemon.production_mode())
