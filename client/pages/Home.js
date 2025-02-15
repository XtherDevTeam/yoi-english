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
  Portal
} from 'react-native-paper';
import { Col, Row, Grid } from "react-native-easy-grid";
import UserBanner from '../components/UserBanner'
import dayjs from 'dayjs'

import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { mdTheme } from '../shared/styles';

const MORE_ICON = Platform.OS === 'ios' ? 'dots-horizontal' : 'dots-vertical'

function ExamRecordItem({ record, type }) {
  const navigation = useNavigation()

  return <DataTable.Row onPress={() => {
    if (type === 'writing') {
      navigation.navigate('WritingExamResultView', { id: record.id, type: type })
    } else if (type === 'reading') {
      navigation.navigate('ReadingExamResultView', { id: record.id, type: type })
    } else if (type === 'oral') {
      navigation.navigate('OralExamResultView', { id: record.id, type: type })
    }
  }}>
    <DataTable.Cell>{dayjs.unix(record.completeTime).format('YYYY-MM-DD')}</DataTable.Cell>
    <DataTable.Cell>{record.examPaper.title}</DataTable.Cell>
    <DataTable.Cell>{record.band}</DataTable.Cell>
  </DataTable.Row>
}

export default function Home({ navigation, route }) {
  const [userId, setUserId] = React.useState(null)
  const [recentRecords, setRecentRecords] = React.useState({
    "oralEnglishExamResults": [],
    'writingExamResults': [],
    'readingExamResults': []
  })
  const [reloadTrigger, setReloadTrigger] = React.useState(0)

  const [message, setMessage] = React.useState(null)

  useFocusEffect(React.useCallback(() => {
    Remote.checkIfLoggedIn().then(r => {
      if (r <= 0) {
        navigation.navigate('Sign In')
      } else {
        console.log(r, 'wdnmd')
        setReloadTrigger(new Date())
        setUserId(r)
        Remote.recentResults().then(r => {
          console.log(r, 'wdnmd')
          setRecentRecords(r)
        })
      }
    })
  }, []))

  return <PaperProvider theme={mdTheme()}>
    <>
      <Appbar.Header>
        <Appbar.Content title='Yoi English'></Appbar.Content>
        {/* <Appbar.Action icon="plus" onPress={() => navigation.navigate('New Character')}></Appbar.Action> */}
      </Appbar.Header>
      <ScrollView style={{ height: '100%', width: '100%' }}>
        <View style={{ width: '95%', alignSelf: 'center' }}>
          <UserBanner userId={userId} reloadTrigger={reloadTrigger}></UserBanner>
          <Card style={{ marginTop: 10 }}>
            <Card.Title title={<Text variant="titleLarge">近期学术文章阅读测试记录</Text>}></Card.Title>
            <Card.Content>
              <DataTable>
                <DataTable.Header>
                  <DataTable.Title>日期</DataTable.Title>
                  <DataTable.Title>测试名称</DataTable.Title>
                  <DataTable.Title>总体评分</DataTable.Title>
                </DataTable.Header>
                {recentRecords.readingExamResults.length > 0 && recentRecords.readingExamResults.map(record => <ExamRecordItem key={record.completeTime} record={record} type='reading'></ExamRecordItem>)}
                {recentRecords.readingExamResults.length === 0 && <View style={{ width: '100%', justifyContent: 'center', alignItems: 'center', padding: 20 }}><Text>暂无记录</Text></View>}
              </DataTable>
            </Card.Content>
          </Card>
          <Card style={{ marginTop: 10 }}>
            <Card.Title title={<Text variant="titleLarge">近期口语测试记录</Text>}></Card.Title>
            <Card.Content>
              <DataTable>
                <DataTable.Header>
                  <DataTable.Title>日期</DataTable.Title>
                  <DataTable.Title>测试名称</DataTable.Title>
                  <DataTable.Title>总体评分</DataTable.Title>
                </DataTable.Header>
                {recentRecords.oralEnglishExamResults.length > 0 && recentRecords.oralEnglishExamResults.map(record => <ExamRecordItem key={record.completeTime} record={record}></ExamRecordItem>)}
                {recentRecords.oralEnglishExamResults.length === 0 && <View style={{ width: '100%', justifyContent: 'center', alignItems: 'center', padding: 20 }}><Text>暂无记录</Text></View>}
              </DataTable>
            </Card.Content>
          </Card>
          <Card style={{ marginTop: 10 }}>
            <Card.Title title={<Text variant="titleLarge">近期写作测试记录</Text>}></Card.Title>
            <Card.Content>
              <DataTable>
                <DataTable.Header>
                  <DataTable.Title>日期</DataTable.Title>
                  <DataTable.Title>测试名称</DataTable.Title>
                  <DataTable.Title>总体评分</DataTable.Title>
                </DataTable.Header>
                {recentRecords.writingExamResults.length > 0 && recentRecords.writingExamResults.map(record => <ExamRecordItem key={record.completeTime} record={record} type='writing'></ExamRecordItem>)}
                {recentRecords.writingExamResults.length === 0 && <View style={{ width: '100%', justifyContent: 'center', alignItems: 'center', padding: 20 }}><Text>暂无记录</Text></View>}
              </DataTable>
            </Card.Content>
          </Card>
        </View>
        <View style={{ margin: 10 }}></View>
      </ScrollView>
      <Portal>
        {message && <Message state={message} message={message} onStateChange={() => setMessage(null)}></Message>}
      </Portal>
    </>
  </PaperProvider>
}