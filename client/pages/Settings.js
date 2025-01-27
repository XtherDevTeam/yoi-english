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
  Button,
  List
} from 'react-native-paper';
import { Col, Row, Grid } from "react-native-easy-grid";
import dayjs from 'dayjs'
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import version from '../shared/version';
import { mdTheme } from '../shared/styles';

export default function Settings() {
  const navigation = useNavigation();
  const [user, setUser] = React.useState(null);
  const [serviceInfo, setServiceInfo] = React.useState(null);
  const theme = mdTheme();

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
      <ScrollView>
        <Card style={{ margin: 10, padding: 10 }}>
          <List.Section title="用户信息">
            <List.Item title="用户名" disabled={user?.username === "test_account"} description={user?.username} onPress={() => {

            }}></List.Item>
            <List.Item title="邮箱" description={user?.email} onPress={() => {

            }}></List.Item>
            <List.Item title="用户密码" disabled={user?.username === "test_account"} description={"点击此处修改密码"} onPress={() => {

            }}></List.Item>
            <List.Item title="身份" disabled={user?.username === "test_account"} description={user?.capabilities.administrator ? "管理员" : "普通用户"}
              onPress={() => {

              }}
            ></List.Item>
            <List.Item title="登出帐号" description={"回到登陆页面"} onPress={() => {

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
    </PaperProvider>
  </>
}