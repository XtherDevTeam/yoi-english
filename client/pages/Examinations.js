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

function ExamParticipationConfirmationDialog({ exam, setExam, onErr, type }) {
  const navigation = useNavigation();
  const [examTypes, setExamTypes] = React.useState({
    reading: "学术文章阅读",
    writing: "写作",
    oral: "口语"
  });

  function handleConfirm() {
    setExam(null)
    console.log(exam, type)
    if (type === 'writing') {
      Remote.establishWritingExamSession(exam.id).then(r => {
        if (r.status) {
          navigation.navigate('WritingExamParticipation', { examSession: r.data.sessionId, type: type })
        } else {
          onErr(r.message)
        }
      }).catch(e => {
        console.log(e)
      })
    } else if (type === 'reading') {
      Remote.establishReadingExamSession(exam.id).then(r => {
        if (r.status) {
          navigation.navigate('ReadingExamParticipation', { examSession: r.data.sessionId, type: type })
        } else {
          onErr(r.message)
        }
      }).catch(e => {
        console.log(e)
      })
    } else if (type === 'oral') {
      Remote.establishOralExamSession(exam.id).then(r => {
        if (r.status) {
          console.log(r.data)
          navigation.navigate('OralExamParticipation', { examSession: r.data.sessionId, type: type })
        } else {
          onErr(r.message)
        }
      }).catch(e => {
        console.log(e)
      })
    }
  }

  function handleCancel() {
    setExam(null)
  }

  return (
    <Portal>
      <Dialog visible={exam} onDismiss={handleCancel}>
        {exam && <><Dialog.Title>确认参加 {exam.title} ？</Dialog.Title>
          <Dialog.Content>
            <Text>确认将参加 {exam.title} {examTypes[type]} 考试{exam.duration ? `，时长为 ${exam.duration} 分钟` : ''}。</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleCancel}>取消</Button>
            <Button onPress={handleConfirm}>确认</Button>
          </Dialog.Actions></>
        }
      </Dialog>
    </Portal>
  )
}

function ExamRow({ exam, type }) {
  const [DialogExam, setDialogExam] = React.useState(null);

  return (
    <DataTable.Row onPress={exam.isAvailable ? () => {
      setDialogExam(exam)
    } : undefined}>
      <DataTable.Cell>{exam.title}</DataTable.Cell>
      <DataTable.Cell>{dayjs.unix(exam.availableTime).format('YYYY-MM-DD HH:mm')}</DataTable.Cell>
      <DataTable.Cell>{exam.duration}</DataTable.Cell>
      <DataTable.Cell>{exam.isAvailable ? '可参与' : '不可参与'}</DataTable.Cell>
      <ExamParticipationConfirmationDialog type={type} exam={DialogExam} setExam={setDialogExam} />
    </DataTable.Row>
  )
}

function OngoingExamSessionBanner({ refresher }) {
  const [ongoingSession, setOngoingSession] = React.useState(null);
  const [examTypes, setExamTypes] = React.useState({
    reading: "学术文章阅读",
    writing: "写作",
    oral: "口语"
  });
  const navigation = useNavigation();

  React.useEffect(() => {
    Remote.getOngoingSession().then(r => {
      if (r.status) {
        console.log(r.data)
        setOngoingSession(r.data)
      }
      else {
        console.log(r.message)
        setOngoingSession(null)
      }
    }).catch(e => {
      console.log(e)
    })
  }, [refresher])

  return <>
    {ongoingSession && <Card style={{ margin: 10 }}>
      <Card.Title title={`正在进行的${examTypes[ongoingSession.type]}考试`} subtitle={ongoingSession.examPaper.title} />
      <Card.Content>
        {ongoingSession.type !== 'oral' && <Text>考试时长：{ongoingSession.duration / 60} 分钟</Text>}
        <Text>开始时间：{dayjs.unix(ongoingSession.startTime).format('YYYY-MM-DD HH:mm')}</Text>
        {ongoingSession.type !== 'oral' && <Text>结束时间：{dayjs.unix(ongoingSession.endTime).format('YYYY-MM-DD HH:mm')}</Text>}
      </Card.Content>
      <Card.Actions>
        <Button mode="text" onPress={() => {
          // exam type enum
          if (ongoingSession.type == 'reading') {
            Remote.finalizeReadingExamSession(ongoingSession.sessionId).then(r => {
              console.log(r)
            })
          } else if (ongoingSession.type == 'writing') {
            Remote.finalizeWritingExamSession(ongoingSession.sessionId).then(r => {
              console.log(r)
            })
          } else if (ongoingSession.type == 'oral') {
            console.log('finalize oral exam')
          }
          setOngoingSession(null)
        }}>结束答题</Button>
        {ongoingSession.type !== 'oral' && <Button mode="text" onPress={() => {
          if (ongoingSession.type == 'writing') {
            navigation.navigate('WritingExamParticipation', { examSession: ongoingSession.sessionId, type: ongoingSession.type })
          } else if (ongoingSession.type == 'reading') {
            navigation.navigate('ReadingExamParticipation', { examSession: ongoingSession.sessionId, type: ongoingSession.type })
          } else if (ongoingSession.type == 'oral') {
            console.log('start oral exam')
          }
          setOngoingSession(null)
        }}>继续答题</Button>}
      </Card.Actions>
    </Card>}
  </>
}

export default function Examinations() {
  const [examinationList, setExaminationList] = React.useState([]);
  const [fabState, setFabState] = React.useState({ open: false });
  const [currentExamType, setCurrentExamType] = React.useState('reading');
  const [examTypeNames, setExamTypeNames] = React.useState({ reading: '学术阅读测试', writing: '写作测试', oral: '口语测试' });
  const [message, setMessage] = React.useState(null);
  const [ongoingSessionRefresher, setOngoingSessionRefresher] = React.useState(0);

  React.useEffect(() => {
    if (currentExamType === 'reading') {
      Remote.getReadingExamList().then(r => {
        if (r.status) {
          setExaminationList(r.data)
        } else {
          setMessage(r.message)
        }
      }).catch(e => {
        setMessage("Error fetching reading examination list")
      })
    } else if (currentExamType === 'writing') {
      Remote.getWritingExamList().then(r => {
        if (r.status) {
          setExaminationList(r.data)
        } else {
          setMessage(r.message)
        }
      }).catch(e => {
        setMessage("Error fetching writing examination list")
      })
    } else if (currentExamType === 'oral') {
      console.log('get oral exam list')
      Remote.getOralExamList().then(r => {
        if (r.status) {
          console.log(r.data)
          setExaminationList(r.data)
        } else {
          setMessage(r.message)
        }
      }).catch(e => {
        setMessage("Error fetching oral examination list")
      })
    }
  }, [currentExamType])

  useFocusEffect(
    React.useCallback(() => {
      setOngoingSessionRefresher(Date.now())
    }, [])
  )

  return <>
    <PaperProvider theme={mdTheme()}>
      <Appbar.Header>
        <Appbar.Content title={examTypeNames[currentExamType]}></Appbar.Content>
      </Appbar.Header>
      <ScrollView>
        <OngoingExamSessionBanner refresher={ongoingSessionRefresher} />
        <Card style={{ margin: 10 }}>
          <DataTable style={{ height: '100%', width: '100%' }}>
            <DataTable.Header>
              <DataTable.Title>名称</DataTable.Title>
              <DataTable.Title>可参与时间</DataTable.Title>
              <DataTable.Title>时长（分钟）</DataTable.Title>
              <DataTable.Title>状态</DataTable.Title>
            </DataTable.Header>
            {examinationList.length !== 0 && examinationList.map(exam => (
              <ExamRow key={exam.id} exam={exam} onErr={(message) => {
                setMessage(message)
              }} type={currentExamType} />
            ))}
            {examinationList.length === 0 && <Text style={{ width: '100%', padding: 20, textAlign: 'center' }} variant="bodyMedium">
              暂无数据，请等候管理员添加。
            </Text>}
          </DataTable>
        </Card>
      </ScrollView>

      <Portal>
        <FAB.Group
          open={fabState.open}
          onStateChange={setFabState}
          icon={fabState.open ? 'close' : 'dots-vertical'}
          actions={[
            { icon: 'book', label: '学术阅读测试列表', onPress: () => setCurrentExamType('reading') },
            { icon: 'pencil', label: '写作测试列表', onPress: () => setCurrentExamType('writing') },
            { icon: 'microphone', label: '口语测试列表', onPress: () => setCurrentExamType('oral') },
          ]}
        ></FAB.Group>

      </Portal>
      {message && <Message state={message} text={message} timeout={3000} onStateChange={(state) => {
        setMessage(null);
      }} />}
    </PaperProvider>
  </>
}