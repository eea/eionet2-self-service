import { React, useState, useEffect } from 'react';
import { UserEdit } from './UserEdit';
import { getMe } from '../data/provider';
import { Backdrop, CircularProgress } from '@mui/material';

var showFunction = Boolean(process.env.REACT_APP_FUNC_NAME);

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
      <Backdrop
        sx={{ color: '#6b32a8', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
      {!loading && isValid && (
        <UserEdit showFunction={showFunction} user={userInfo} />
      )}
    </div>
  );
}
