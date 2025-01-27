import * as React from 'react';

import {
  ScrollView,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import {
  Appbar,
  Avatar,
  Button,
  Portal,
  Text,
  TextInput,
  PaperProvider
} from 'react-native-paper';
import * as Linking from 'expo-linking';
import { mdTheme } from '../shared/styles';
import { useFocusEffect } from '@react-navigation/native';

import { Col, Row, Grid } from "react-native-easy-grid";

import Message from '../components/Message';
import * as Remote from '../shared/remote';
import * as storage from '../shared/storage';

export default function SignInSelfHosted({ navigation, route }) {
  const [serverAddress, setServerAddress] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [message, setMessage] = React.useState(null);

  const AddrInputRef = React.useRef(null);
  const EmailInputRef = React.useRef(null);
  const PasswordInputRef = React.useRef(null);

  React.useEffect(() => {
    if (serverAddress || email) {
      storage.setItem('serverAddress', serverAddress, (e) => {
        Remote.refreshServerUrl();
      });
      storage.setItem('email', email, (e) => { });
    }
  }, [serverAddress, email]);

  useFocusEffect(
    React.useCallback(() => {
      storage.inquireItem('serverAddress', (e, serverAddress) => {
        if (serverAddress) {
          setServerAddress(serverAddress);
        }
      });
      storage.inquireItem('email', (e, email) => {
        if (email) {
          setEmail(email);
        }
      });
    }, []))

  return <>
    <PaperProvider theme={mdTheme()}>
      <TouchableWithoutFeedback onPress={() => {
        AddrInputRef.current?.blur();
        EmailInputRef.current?.blur();
        PasswordInputRef.current?.blur();
      }} accessible={false}>
        <Grid>
          <Row size={10}></Row>
          <Row size={60}>
            <Col style={{ alignSelf: 'center', justifyContent: 'center', alignItems: 'center' }}>
              <View style={{ padding: 20, width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                <Avatar.Image source={require('../assets/icon.png')} size={100} />
                <Text variant="titleLarge" style={{ margin: 10 }}>登录到自托管服务器</Text>
                <TextInput
                  mode="contained"
                  label="自托管服务器地址"
                  placeholder="https://example.com"
                  value={serverAddress}
                  style={{ margin: 10, width: '100%' }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  onChangeText={(text) => {
                    setServerAddress(text);
                  }}
                  ref={AddrInputRef}
                />
                <TextInput
                  mode="contained"
                  label="用户邮箱"
                  placeholder="admin@mail.xiaokang00010.top"
                  value={email}
                  style={{ margin: 10, width: '100%' }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  onChangeText={(text) => {
                    setEmail(text);
                  }}
                  ref={EmailInputRef}
                />
                <TextInput
                  mode="contained"
                  label="密码"
                  value={password}
                  style={{ margin: 10, width: '100%' }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry={true}
                  onChangeText={(text) => {
                    setPassword(text);
                  }}
                  ref={PasswordInputRef}
                />
                <Button
                  mode="contained"
                  style={{ margin: 10, width: '100%' }}

                  onPress={async () => {
                    try {
                      res = await Remote.signIn(email, password);
                      if (res.status) {
                        await storage.clearImageCache();
                        navigation.popToTop();
                      } else {
                        setMessage(res.message)
                      }
                    } catch (error) {
                      setMessage(error.message);
                    }
                  }}>
                  登录
                </Button>
                <View style={{ alignItems: 'center', margin: 10, width: '100%', justifyContent: 'center' }}>
                  <Text>
                    <Text variant="bodyMedium" style={{}}>
                      服务器管理员可在
                    </Text>
                    <Text style={{ fontWeight: 'bold' }} onPress={() => {
                      Linking.openURL(serverAddress);
                    }}>此处</Text>
                    <Text variant="bodyMedium" style={{}}>
                      查看服务器状态。
                    </Text>
                  </Text>
                </View>
              </View>
            </Col>
          </Row>
          <Row size={10}>
            <Text variant="bodyMedium" style={{ margin: 20, textAlign: 'center' }}>
              用户数据归企业（学校）所管理，软件不存储、上传或分享用户数据。
            </Text>
          </Row>
        </Grid>
      </TouchableWithoutFeedback>
      {message && <Message state={message} text={message} timeout={3000} onStateChange={(state) => {
        setMessage(null);
      }} />}
    </PaperProvider >
  </>
}