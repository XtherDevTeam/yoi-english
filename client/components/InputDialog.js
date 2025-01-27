import * as React from 'react';
import * as Remote from '../shared/remote'
import Message from '../components/Message'
import { Platform, View, ScrollView } from 'react-native';
import {
  Appbar,
  PaperProvider,
  Text,
  Card,
  DataTable,
  FAB,
  Portal,
  Dialog,
  Button
} from 'react-native-paper';
import { Col, Row, Grid } from "react-native-easy-grid";
import dayjs from 'dayjs'
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';

import { mdTheme } from '../shared/styles';

const InputDialog = ({ props }) => {
  const [value, setValue] = React.useState(props.defaultValue || '');


  return <>
    <Dialog visible={props} onDismiss={props.onDismiss}>
      <Dialog.Title>{props.title}</Dialog.Title>
      <Dialog.Content>
        <Text variant="bodyMedium">
          {props.description || ''}
        </Text>
        <TextInput
          variant="outlined"
          value={value}
          onChangeText={text => setValue(text)}
          style={{ margin: 10 }}
        />
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
    </Dialog >
  </>
}

const PasswordEditDialog = ({ props }) => {
  const [oldPassword, setOldPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');

  return <>
    <Dialog visible={props} onDismiss={props.onDismiss}>
      <Dialog.Title>修改密码</Dialog.Title>
      <Dialog.Content>
        <Text variant="bodyMedium">
          请输入旧密码和新密码
        </Text>
        <TextInput
          variant="outlined"
          value={oldPassword}
          onChangeText={text => setOldPassword(text)}
          style={{ margin: 10 }}
          secureTextEntry={true}
        />
        <TextInput
          variant="outlined"
          value={newPassword}
          onChangeText={text => setNewPassword(text)}
          style={{ margin: 10 }}
          secureTextEntry={true}
        />
        <TextInput
          variant="outlined"
          value={confirmPassword}
          onChangeText={text => setConfirmPassword(text)}
          style={{ margin: 10 }}
          secureTextEntry={true}
        />
      </Dialog.Content>
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
    </Dialog >
  </>
}