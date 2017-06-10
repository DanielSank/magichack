import os

import jinja2
import MySQLdb
import sqlalchemy as sa
from sqlalchemy import MetaData
import sqlemon
import webapp2

import magichack.forms as forms
import magichack.models as models
import magichack.secrets as secrets
import magichack.util as util


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


class CardQuery(webapp2.RequestHandler):
    def get(self):
        form = forms.CardQueryForm()
        template = JINJA_ENVIRONMENT.get_template('card_query.html')
        self.response.write(template.render({'form': form}))

    def post(self):
        session = session_maker()
        query = session.query(models.Card)
        form = forms.CardQueryForm(formdata=self.request.POST)

        # Name filter
        card_name = form.name.data
        if card_name:
            query = query.filter_by(name=card_name)

        # Primary type filter
        primary_type = form.primary_type.data
        query = query.filter_by(primary_type=primary_type)

        # Cost filter
        cost = form.cost.data
        if cost is not None:
            parsed_cost = util.parse_cost(cost)
            for color in models.COLORS:
                val = parsed_cost[color]
                if val is not None:
                    field = getattr(models.Card, 'mana_{}'.format(
                        color.lower()))
                    query = query.filter(field==val)

        cards = query.all()

        template = JINJA_ENVIRONMENT.get_template('results.html')
        self.response.write(
                template.render(
                    {'cards': cards}))
        session.close()


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
            ('/tables', DBConnectionSQLAlchemy),
            ('/query', CardQuery),
        ],
        debug=not sqlemon.production_mode())
