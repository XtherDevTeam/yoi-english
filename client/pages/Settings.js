import * as React from 'react';
import * as Remote from '../shared/remote'
import Message from '../components/Message'
import { Platform, View, ScrollView, KeyboardAvoidingView } from 'react-native';
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
  List
} from 'react-native-paper';
import { Col, Row, Grid } from "react-native-easy-grid";
import dayjs from 'dayjs'
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import version from '../shared/version';
import { mdTheme } from '../shared/styles';
import { InputDialog, PasswordEditDialog } from '../components/InputDialog';

export default function Settings() {
  const navigation = useNavigation();
  const [user, setUser] = React.useState(null);
  const [serviceInfo, setServiceInfo] = React.useState(null);
  const [inputDialogProps, setInputDialogProps] = React.useState(null);
  const [passwordUpdateDialogProps, setPasswordUpdateDialogProps] = React.useState(null);
  const [isTestAccount, setIsTestAccount] = React.useState(false);
  const theme = mdTheme();

  React.useEffect(() => {
    console.log(user?.username === "test_account")
    if (user?.username === "test_account") {
      console.log("Test account detected")
      setIsTestAccount(true)
    } else {
      setIsTestAccount(false)
    }
  }, [user])

  useFocusEffect(
    React.useCallback(() => {
      Remote.myInfo().then(r => {
        setUser(r.data)
      })
      Remote.getServiceInfo().then(r => {
        setServiceInfo(r)
      })
    }, [])
  )

  return <>
    <PaperProvider theme={theme}>
      <Appbar.Header>
        <Appbar.Content title="设置" />
      </Appbar.Header>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "none"}>
        <ScrollView>
          <Card style={{ margin: 10, padding: 10 }}>
            <List.Section title="用户信息">
              <List.Item title={"用户名" + (isTestAccount ? " ( 测试账户无法修改 ) " : "")} disabled={isTestAccount} description={user?.username} onPress={() => {
                setInputDialogProps({
                  title: "修改用户名",
                  description: "请输入新的用户名",
                  defaultValue: user?.username,
                  onConfirm: (value) => { },
                  onDismiss: () => {
                    setInputDialogProps(null)
                  }
                })
              }}></List.Item>
              <List.Item title={"邮箱" + (isTestAccount ? " ( 测试账户无法修改 ) " : "")} disabled={isTestAccount} description={user?.email} onPress={() => {
                setInputDialogProps({
                  title: "修改用户邮箱",
                  description: "修改后，请使用新邮箱进行登陆。",
                  defaultValue: user?.email,
                  onConfirm: (value) => { },
                  onDismiss: () => {
                    setInputDialogProps(null)
                  }
                })
              }}></List.Item>
              <List.Item title={"用户密码" + (isTestAccount ? " ( 测试账户无法修改 ) " : "")} disabled={isTestAccount} description={"点击此处修改密码"} onPress={() => {
                setPasswordUpdateDialogProps({
                  onConfirm: (value) => { },
                  onDismiss: () => {
                    setPasswordUpdateDialogProps(null)
                  },
                  onErr: (e) => {
                    console.log(e)
                  }
                })
              }}></List.Item>
              <List.Item title="身份" description={user?.capabilities.administrator ? "管理员" : "普通用户"}></List.Item>
              <List.Item title="登出帐号" description={"回到登陆页面"} onPress={() => {
                Remote.signOut().then(() => {
                  navigation.navigate("Sign In")
                })
              }}></List.Item>
            </List.Section>
          </Card>
          <Card style={{ margin: 10, padding: 10 }}>
            <List.Section title="软件相关">
              <List.Item title="所属（组织/学校）" description={`${serviceInfo?.authorized_organization}`}></List.Item>
              <List.Item title="后端版本号" description={`Yoi English Backend ${serviceInfo?.version} (${serviceInfo?.buildNumber})`}></List.Item>
              <List.Item title="关于 Yoi English" description={`Yoi English 版本 ${version.version} (${version.build})`}></List.Item>
            </List.Section>
          </Card>
        </ScrollView>
        <Portal>
          <InputDialog props={inputDialogProps} />
          <PasswordEditDialog props={passwordUpdateDialogProps} />
        </Portal>
      </KeyboardAvoidingView>
    </PaperProvider>
  </>
}