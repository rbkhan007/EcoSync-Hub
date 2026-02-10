import React from 'react';
import Groups from '../components/Groups';
import { Container } from '@mui/material';

const GroupsPage = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Groups />
    </Container>
  );
};

export default GroupsPage;
