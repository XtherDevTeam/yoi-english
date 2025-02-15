import * as React from 'react';

import {
  ScrollView,
  TouchableWithoutFeedback,
  View,
  KeyboardAvoidingView,
  Platform
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
import { mdTheme } from '../shared/styles';
import { useFocusEffect } from '@react-navigation/native';

import { Col, Row, Grid } from "react-native-easy-grid";

import Message from '../components/Message';
import * as Remote from '../shared/remote';
import * as storage from '../shared/storage';
import * as Speech from 'expo-speech';

export default function SignIn({ navigation, route }) {
  useFocusEffect(
    React.useCallback(() => {
      Remote.checkIfLoggedIn().then(res => {
        if (res > 0) {
          navigation.goBack();
        }
      })
    }))

  return <>
    <PaperProvider theme={mdTheme()}>
      <Grid>
        <Row size={75}>
          <Col style={{ alignSelf: 'center', justifyContent: 'center', alignItems: 'center' }}>
            <Avatar.Image source={require('../assets/icon.png')} size={100} />
            <Text variant="displaySmall" style={{ margin: 10 }}>Yoi English</Text>
            <Text variant="bodyMedium" style={{ margin: 20, textAlign: 'center' }}>
              一个开源、免费的英语学习应用
            </Text>
          </Col>
        </Row>
        <Row size={25}>
          <Col>
          <Button style={{ margin: 10 }} mode="contained" onPress={() => {
            Speech.getAvailableVoicesAsync().then(voices => {
              console.log(voices)
            })
            Speech.speak(`Instead, let's watch the fireworks together in silence. You can record the beautiful scenery and all the things you wanna say down. Not that this is the end, of course. On the contrary, I believe that our story is only just beginning.`)
          }}>
              测试TTS语音功能
            </Button>
            <Button style={{ margin: 10 }} mode="contained" onPress={() => navigation.navigate('Sign In Evaluation')}>
              以测试账号登录
            </Button>
            <Button style={{ margin: 10 }} mode="contained" onPress={() => navigation.navigate('Sign In Self Hosted')}>
              登录到自托管服务器
            </Button>
          </Col>
        </Row>
      </Grid>
    </PaperProvider >
  </>
}