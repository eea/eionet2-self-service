import { React, useState, useEffect } from 'react';
import { UserEdit } from './UserEdit';
import { getMe } from '../data/provider';
import { Backdrop, CircularProgress, Typography } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const showFunction = Boolean(process.env.REACT_APP_FUNC_NAME);

const theme = createTheme({
  palette: {
    primary: {
      light: '#00A390',
      main: '#007B6C',
      dark: '#005248',
    },
    secondary: {
      light: '#006BB8',
      main: '#004B7F',
      dark: '#003052',
    },
    error: {
      main: '#B83230',
    },
    warning: {
      main: '#FF9933',
    },
    success: {
      main: '#007B6C',
    },
    info: {
      main: '#004B7F',
    },
    text: {
      primary: '#3D5265',
    },
    suplementary: {
      main: '#F9F9F9',
      text: '#3D5265',
    },
  },
});

export default function Tab() {
  const [userInfo, setUserInfo] = useState({}),
    [loading, setloading] = useState(false),
    [isValid, setIsValid] = useState(false);
  useEffect(() => {
    (async () => {
      setloading(true);
      let me = await getMe();
      setUserInfo(me);
      setIsValid(me && me.IsValid);
      setloading(false);
    })();
  }, []);

  return (
    <div>
      <ThemeProvider theme={theme}>
        <Backdrop
          sx={{ color: '#6b32a8', zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={loading}
        >
          <CircularProgress color="inherit" />
        </Backdrop>
        {!loading && isValid && (
          <UserEdit showFunction={showFunction} user={userInfo} />
        )}
        <Typography
          sx={{
            position: 'absolute',
            bottom: '0',
            left: '0',
            width: '100%',
            zIndex: 1,
          }}
        >
          v{`${process.env.REACT_APP_VERSION}`}
        </Typography>
      </ThemeProvider>
    </div>
  );
}
