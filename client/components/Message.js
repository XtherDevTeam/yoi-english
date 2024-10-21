import * as React from 'react';

import {
  Snackbar,
  withTheme,
} from 'react-native-paper';

function Message({ state, onStateChange, text, icon, theme, style, timeout }) {
  React.useEffect(() => {
    if (state == true) {
      setTimeout(() => onStateChange(), timeout)
    }
  }, [state])
  return <Snackbar visible={state} onDismiss={() => { onStateChange() }} icon={icon} theme={theme} style={style}>
    {text}
  </Snackbar>
}

export default withTheme(Message)