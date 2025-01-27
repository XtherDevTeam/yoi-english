import * as React from 'react';

import { Platform } from 'react-native';
import {
  Appbar,
  PaperProvider,
  Card,
  Text,
  Avatar,
  Chip
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
      <Card.Cover source={require('../assets/headimg.jpg')} style={{ height: 150 }} />
      <Card.Title title={<Text variant="titleLarge">{userDetails?.username}</Text>} subtitle={userDetails?.email} left={(props) => <Avatar.Image size={50} source={{ uri: avatarUrl }} />} />
      <Card.Content>
        <Chip icon="information" >
          总体评分: {userDetails?.overallBand}
        </Chip>
        <Text variant="bodyMedium" style={{ marginTop: 10 }}>
          {userDetails?.overallPerformance || '暂无数据。通过参与写作、学术阅读、口语测试，用户可以获得由AI生成的近期训练情况反馈，以帮助用户更好地提高英语成绩。'}
        </Text>
        {children}
      </Card.Content>
    </Card>
  </>
}