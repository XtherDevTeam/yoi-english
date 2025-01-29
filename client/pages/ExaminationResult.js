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
  ActivityIndicator,
  TextInput,
} from 'react-native-paper';
import { Col, Row, Grid } from "react-native-easy-grid";
import dayjs from 'dayjs'
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { KeyboardAvoidingView } from 'react-native';
import { markedTheme, mdTheme } from '../shared/styles';
import Markdown from 'react-native-markdown-display';
import theme from '../shared/theme';

export default function ExaminationResult() {
  const [resultList, setResultList] = React.useState([])
  const [message, setMessage] = React.useState(null)
  const [fabState, setFabState] = React.useState({ open: false })
  const [examinationType, setExaminationType] = React.useState('reading')
  const [examTypeNames, setExamTypeNames] = React.useState({ reading: '学术阅读测试记录', writing: '写作测试记录', speaking: '口语测试记录' });
  const [routeMapping, setRouteMapping] = React.useState({ reading: 'ReadingExamResultView', writing: 'WritingExamResultView' });

  const fetchExamResult = () => {
    if (examinationType === 'reading') {
      Remote.getReadingExamResultList().then(r => {
        if (r.status) {
          setResultList(r.data)
        } else {
          setMessage(r.message)
        }
      }).catch(e => {
        setMessage('Network error')
      })
    } else if (examinationType === 'writing') {
      Remote.getWritingExamResultList().then(r => {
        if (r.status) {
          setResultList(r.data)
        } else {
          setMessage(r.message)
        }
      }).catch(e => {
        setMessage('Network error')
      })
    }
  }

  React.useEffect(() => {
    fetchExamResult()
  }, [examinationType])

  const navigation = useNavigation()

  return <>
    <PaperProvider theme={mdTheme()}>
      <Appbar.Header>
        <Appbar.Content title={examTypeNames[examinationType]}></Appbar.Content>
      </Appbar.Header>
      <ScrollView>
        <Card style={{ margin: 10 }}>
          <DataTable>
            <DataTable.Header>
              <DataTable.Title>完成日期</DataTable.Title>
              <DataTable.Title>考试名称</DataTable.Title>
              <DataTable.Title>总体评分</DataTable.Title>
            </DataTable.Header>
            {resultList.map((item, index) => (
              <DataTable.Row key={index} onPress={() => {
                navigation.navigate(routeMapping[examinationType], { id: item.id })
              }}>
                <DataTable.Cell>{dayjs.unix(item.completeTime).format('YYYY-MM-DD')}</DataTable.Cell>
                <DataTable.Cell>{item.examPaper.title}</DataTable.Cell>
                <DataTable.Cell>{item.band}</DataTable.Cell>
              </DataTable.Row>
            ))}
          </DataTable>
        </Card>
      </ScrollView>
      <Portal>
        <FAB.Group
          open={fabState.open}
          onStateChange={setFabState}
          icon={fabState.open ? 'close' : 'dots-vertical'}
          actions={[
            { icon: 'book', label: '学术阅读测试记录列表', onPress: () => setExaminationType('reading') },
            { icon: 'pencil', label: '写作测试记录列表', onPress: () => setExaminationType('writing') },
            { icon: 'microphone', label: '口语测试记录列表', onPress: () => console.log('Pressed delete') },
          ]}
        ></FAB.Group>

      </Portal>
      {message && <Message state={message} text={message} timeout={3000} onStateChange={(state) => {
        setMessage(null);
      }} />}
    </PaperProvider>
  </>
}