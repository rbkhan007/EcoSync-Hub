import React from 'react';
import Reels from '../components/Reels';
import { Container } from '@mui/material';

const ReelsPage = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Reels />
    </Container>
  );
};

export default ReelsPage;
