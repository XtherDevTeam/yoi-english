import * as React from 'react';

import { Platform, ScrollView } from 'react-native';
import {
  Appbar,
  PaperProvider,
  Card,
  Text,
  Avatar,
  Chip,
  Dialog,
  Button,
  Portal
} from 'react-native-paper';
import * as Remote from '../shared/remote'
import { useFocusEffect } from '@react-navigation/native';

export default function UserBanner({ userId, style, children, onRecv, reloadTrigger }) {
  const [userDetails, setUserDetails] = React.useState({
    name: '',
    email: '',
    capabilities: {
      administrator: false
    }
  });
  const [avatarUrl, setAvatarUrl] = React.useState(null);
  const [infoDialogOpen, infoDialogSetOpen] = React.useState(false);

  React.useEffect(() => {
    console.log('triggered reload', userId)
    if (userId > 0) {
      Remote.getUserInfo(userId).then(data => {
        if (data.status) {
          console.log(data.data);
          setUserDetails(data.data);
          setAvatarUrl(Remote.userAvatar(userId));
        } else {
          console.log('failed to get user info', data);
        }
      });
    } else {
      Remote.myInfo().then(data => {
        if (data.status) {
          console.log(data.data);
          setUserDetails(data.data);
          setAvatarUrl(Remote.myAvatar());
        } else {
          console.log('failed to get my info');
        }
      });
    }
  }, [userId, reloadTrigger]);

  React.useEffect(() => {
    if (onRecv)
      onRecv(userDetails)
  }, [userDetails])

  return <>
    <Card style={{ ...style }}>
      <Portal>
      <Dialog visible={infoDialogOpen} onDismiss={() => infoDialogSetOpen(false)}>
        <Dialog.Title>用户近期训练情况</Dialog.Title>
        <Dialog.Content>
          <ScrollView style={{ maxHeight: 300 }}>
          <Text>{userDetails?.overallPerformance}</Text>
          </ScrollView>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => infoDialogSetOpen(false)}>
            关闭
          </Button>
        </Dialog.Actions>
      </Dialog>
      </Portal>
      <Card.Cover source={require('../assets/headimg.jpg')} style={{ height: 150 }} />
      <Card.Title title={<Text variant="titleLarge">{userDetails?.username}</Text>} subtitle={userDetails?.email} left={(props) => <Avatar.Image size={50} source={{ uri: avatarUrl }} />} />
      <Card.Content>
        <Chip icon="information" >
          总体评分: {userDetails?.overallBand}
        </Chip>
        <Text variant="bodyMedium" style={{ marginTop: 10 }} onPress={() => {
          infoDialogSetOpen(true)
        }}>
          {`${userDetails?.overallPerformance?.substring(0, 100)}${userDetails?.overallPerformance?.length > 100 ? "..." : ""}` || '暂无数据。通过参与写作、学术阅读、口语测试，用户可以获得由AI生成的近期训练情况反馈，以帮助用户更好地提高英语成绩。'}
        </Text>
        {children}
      </Card.Content>
    </Card >
  </>
}