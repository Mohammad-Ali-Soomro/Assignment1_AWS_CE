const express = require('express');
const path = require('path');

const env = require('./config/env');
const { errorHandler, notFoundHandler } = require('./middlewares/errorMiddleware');
const healthRoutes = require('./routes/healthRoutes');
const webEventRoutes = require('./routes/webEventRoutes');
const apiEventRoutes = require('./routes/apiEventRoutes');

const TicketmasterService = require('./services/ticketmasterService');
const S3Service = require('./services/s3Service');
const EventSyncService = require('./services/eventSyncService');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('trust proxy', true);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(process.cwd(), 'public')));

const ticketmasterService = new TicketmasterService(env.ticketmaster);
const s3Service = new S3Service(env.aws);
const eventSyncService = new EventSyncService({ ticketmasterService, s3Service });

app.locals.eventSyncService = eventSyncService;

app.get('/', (_req, res) => {
  res.redirect('/events');
});

app.use('/health', healthRoutes);
app.use('/events', webEventRoutes);
app.use('/api/events', apiEventRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
