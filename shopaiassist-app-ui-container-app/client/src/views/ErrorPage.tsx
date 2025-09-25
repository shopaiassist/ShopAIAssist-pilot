import React from 'react';
import { Translate } from '@/';
import { Box, Container, Typography } from '@mui/material';
import { useRouteError } from 'react-router-dom';

import LOG from '../services/LoggingService';

interface ErrorPageProps {
  statusText?: string;
  message?: string;
}

/**
 * Error page when route not found
 * @constructor
 */
const ErrorPage = () => {
  const error = useRouteError() as ErrorPageProps;
  LOG.error(error);

  return (
    <Container maxWidth="sm" id="error-page">
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <Typography variant="h2" component="h1" gutterBottom>
          <Translate tKey="OOPS" />
        </Typography>
        <Typography variant="body1">
          <Translate tKey="UNEXPECTED_ERROR" />
        </Typography>
        <Typography variant="body1">
          <i>{error.statusText || error.message}</i>
        </Typography>
      </Box>
    </Container>
  );
};

export default ErrorPage;
