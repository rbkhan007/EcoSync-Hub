import React from 'react';
import Events from '../components/Events';
import { Container } from '@mui/material';

const EventsPage = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Events />
    </Container>
  );
};

export default EventsPage;
