import * as React from 'react';

import {
  ScrollView,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {
  Appbar,
  Avatar,
  Button,
  Portal,
  Text,
  TextInput,
} from 'react-native-paper';

import Message from '../components/Message';
import * as Remote from '../shared/remote';
import * as storage from '../shared/storage';

export default SignIn = ({ navigation, route }) => {
  const serverAddressRef = React.useRef(null)
  const usernameRef = React.useRef(null)
  const passwordRef = React.useRef(null)
  const googleApiTokenRef = React.useRef(null)

  const handlePress = () => {
    serverAddressRef.current?.blur()
    usernameRef.current?.blur()
    passwordRef.current?.blur()
    setMessageState(false)
  }

  const [serverInitialized, setServerInitialized] = React.useState(-1)
  const [serverAddressState, setServerAddressState] = React.useState("")
  const [usernameState, setUsernameState] = React.useState("")
  const [passwordState, setPasswordState] = React.useState("")
  const [googleApiToken, setGoogleApiToken] = React.useState("")
  const [messageState, setMessageState] = React.useState(false)
  const [messageText, setMessageText] = React.useState("")
  const [currentLoginState, setCurrentLoginState] = React.useState(false)
  const [sessionUsername, setSessionUsername] = React.useState("")

  function getUserName() {
    Remote.getUserName().then(r => setSessionUsername(r))
  }

  React.useEffect(() => {
    storage.inquireItem('serverAddress', (result, v) => {
      if (result) {
        setServerAddressState(v)
      }
    })
    storage.removeItem('loginSession', r => { })
    storage.removeItem('loginStatus', r => { })
    Remote.refreshServerUrl()
  }, [])

  React.useEffect(() => {
    storage.setItem('serverAddress', serverAddressState, r => { })
    Remote.refreshServerUrl()
  }, [serverAddressState])

  function onSubmit(username, password, googleApiToken = undefined) {
    if (serverInitialized == -1) {
      Remote.checkIfInitialized().then(r => {
        console.log(r)
        if (r) {
          getUserName()
          setServerInitialized(2)
        } else {
          setServerInitialized(1)
        }
      }).catch(e => {
        setMessageText(`Unable to check server status: ${e}`)
        setMessageState(true)
      })
    } else if (serverInitialized == 1) {
      Remote.initialize(username, password).then(r => {
        if (r.data.status) {
          setServerInitialized(3)
          setTimeout(() => navigation.goBack(), 1000)
        } else {
          setMessageText(`Oops, something went wrong... ${r.data.data}`)
          setMessageState(true)
        }
      }).catch(e => {
        setMessageText(`Oops, something went wrong... ${e}`)
        setMessageState(true)
      })
    } else if (serverInitialized == 2) {
      Remote.signIn(password).then(r => {
        if (r.data.status) {
          navigation.goBack()
        } else {
          setMessageText(`Oops, something went wrong... ${r.data.data}`)
          setMessageState(true)
        }
      }).catch(e => {
        setMessageText(`Oops, something went wrong... ${e}`)
        setMessageState(true)
      })
    }
  }

  return (
    <>
      <Appbar.Header>
        <Appbar.Content title="Sign In" ></Appbar.Content>
      </Appbar.Header>
      <ScrollView>
        <TouchableWithoutFeedback onPress={handlePress} accessible={false}>
          <View style={{ justifyContent: 'center', alignItems: 'center' }}>
            <Avatar.Image
              source={require('../assets/new.png')}
              size={100}
              style={{ marginTop: 20 }}
            />

            {serverInitialized == 3 && <>
              <Text variant="headlineSmall" style={{ marginTop: 20 }}>🎉 Congraulations</Text>
              <Text variant='bodySmall' style={{ width: "90%", marginTop: 20, textAlign: 'center' }}>
                Please wait for server setting up...
              </Text>
            </>}

            {serverInitialized == -1 && <>
              <Text variant="headlineSmall" style={{ marginTop: 20 }}>Yoi English</Text>
              <TextInput
                label="Server Address"
                placeholder='http://yoimiyaIsTheBest.localhost:11452/'
                style={{ width: '90%', marginTop: 20 }}
                ref={serverAddressRef}
                value={serverAddressState}
                keyboardType='url'
                onChangeText={(v) => setServerAddressState(v)}
              />
              <Button mode='contained-tonal' style={{ width: '90%', marginTop: 20 }} onPress={() => {
                onSubmit(usernameState, passwordState)
              }}>Next...</Button>
            </>}

            {serverInitialized == 2 && <>
              <Text variant="headlineSmall" style={{ marginTop: 20 }}>Welcome back, {sessionUsername}</Text>
              <TextInput
                label="Password"
                placeholder='Enter your password here...'
                secureTextEntry
                style={{ width: '90%', marginTop: 20 }}
                ref={passwordRef}
                value={passwordState}
                onChangeText={(v) => setPasswordState(v)}
              />
              <Button mode='contained-tonal' style={{ width: '90%', marginTop: 20 }} onPress={() => {
                onSubmit(usernameState, passwordState)
              }}>Sign In</Button>
            </>}

            {serverInitialized == 1 && <>
              <Text variant="headlineSmall" style={{ marginTop: 20 }}>You are almost there</Text>
              <Text variant='bodySmall' style={{ width: "90%", marginTop: 20, textAlign: 'center' }}>
                You are setting up a new server. Please enter your user name and password to initialize.
              </Text>

              <TextInput
                label="Username"
                placeholder='Jerry Chou'
                style={{ width: '90%', marginTop: 20 }}
                ref={usernameRef}
                value={usernameState}
                onChangeText={(v) => setUsernameState(v)}
              />

              <TextInput
                label="Password"
                placeholder='Enter your password here...'
                secureTextEntry
                style={{ width: '90%', marginTop: 20 }}
                ref={passwordRef}
                value={passwordState}
                onChangeText={(v) => setPasswordState(v)}
              />

              <TextInput
                label="Google API Token"
                placeholder='A Google API token is required to use Gemini 1.5 Pro features'
                secureTextEntry
                style={{ width: '90%', marginTop: 20 }}
                ref={googleApiTokenRef}
                value={googleApiToken}
                onChangeText={(v) => setGoogleApiToken(v)}
              />

              <Button mode='contained-tonal' style={{ width: '90%', marginTop: 20 }} onPress={() => {
                onSubmit(usernameState, passwordState, googleApiToken)
              }}>Initialize</Button>
            </>}

            <Text variant='bodySmall' style={{ width: "90%", marginTop: 20, textAlign: 'center' }}>
              Fireworks are for now, but friends are forever!
            </Text>
            <Portal>
              <Message timeout={5000} style={{ marginBottom: 64 }} state={messageState} onStateChange={() => { setMessageState(false) }} icon="alert-circle" text={messageText} />
            </Portal>
          </View >

        </TouchableWithoutFeedback >
      </ScrollView>
    </>
  )
};
