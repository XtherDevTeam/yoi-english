import * as React from 'react';
import * as Remote from '../shared/remote'
import Message from '../components/Message'
import { Platform, View, ScrollView, KeyboardAvoidingView, TouchableWithoutFeedback } from 'react-native';
import {
  Appbar,
  PaperProvider,
  Text,
  Card,
  DataTable,
  FAB,
  Portal,
  Dialog,
  Button,
  TextInput,
} from 'react-native-paper';
import { Col, Row, Grid } from "react-native-easy-grid";
import dayjs from 'dayjs'
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';

import { mdTheme } from '../shared/styles';

const InputDialog = ({ props }) => {
  const [value, setValue] = React.useState(props?.defaultValue || '');

  React.useEffect(() => {
    if (props?.defaultValue) {
      setValue(props.defaultValue)
    }
  }, [props])

  return <>
    <Dialog visible={props} onDismiss={props?.onDismiss}>
      {props && <><Dialog.Title>{props.title}</Dialog.Title>
        <Dialog.Content>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "none"}>
            <Text variant="bodyMedium">
              {props.description || ''}
            </Text>
            <TextInput
              mode="outlined"
              value={value}
              onChangeText={text => setValue(text)}
              style={{ margin: 10 }}
            />
          </KeyboardAvoidingView>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={props.onDismiss} mode="text">Cancel</Button>
          <Button onPress={() => {
            props.onConfirm(value)
            props.onDismiss()
          }} mode="text">
            OK
          </Button>
        </Dialog.Actions>
      </>}
    </Dialog >
  </>
}

const PasswordEditDialog = ({ props }) => {
  const [oldPassword, setOldPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');

  const oldPasswordRef = React.useRef(null);
  const newPasswordRef = React.useRef(null);
  const confirmPasswordRef = React.useRef(null);

  return <>
    <Dialog visible={props} onDismiss={props?.onDismiss}>
      {props &&
        <><Dialog.Title>修改密码</Dialog.Title>
          <TouchableWithoutFeedback onPress={() => {
            console.log('blurrr')
            oldPasswordRef.current?.blur()
            newPasswordRef.current?.blur()
            confirmPasswordRef.current?.blur()
          }}>
            <Dialog.Content>
              <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "none"}>
                <>
                  <Text variant="bodyMedium">
                    请输入旧密码和新密码
                  </Text>
                  <TextInput
                    mode="outlined"
                    value={oldPassword}
                    label="旧密码"
                    onChangeText={text => setOldPassword(text)}
                    style={{ margin: 10 }}
                    secureTextEntry={true}
                    ref={oldPasswordRef}
                  />
                  <TextInput
                    mode="outlined"
                    value={newPassword}
                    label="新密码"
                    onChangeText={text => setNewPassword(text)}
                    style={{ margin: 10 }}
                    secureTextEntry={true}
                    ref={newPasswordRef}
                  />
                  <TextInput
                    mode="outlined"
                    value={confirmPassword}
                    label="确认密码"
                    onChangeText={text => setConfirmPassword(text)}
                    style={{ margin: 10 }}
                    secureTextEntry={true}
                    ref={confirmPasswordRef}
                  /></>
              </KeyboardAvoidingView>
            </Dialog.Content>
          </TouchableWithoutFeedback>
          <Dialog.Actions>
            <Button onPress={props.onDismiss} mode="text">取消</Button>
            <Button onPress={() => {
              if (newPassword !== confirmPassword) {
                props.onErr('两次输入的密码不一致')
              } else {
                props.onConfirm(oldPassword, newPassword)
                props.onDismiss()
              }
            }} mode="text">
              确定
            </Button>
          </Dialog.Actions>
        </>}
    </Dialog >
  </>
}

export {
  InputDialog,
  PasswordEditDialog,
}