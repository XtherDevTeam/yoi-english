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

function ProblemStatementPresentation({ sessionDetails }) {
  const theme = markedTheme()
  return (
    <>
      <Card style={{ margin: 10, padding: 10 }}>
        <Card.Title title={sessionDetails.examPaper.title} />
        <Card.Content>
          <Text>
            <Text variant="titleMedium">开始时间: </Text>
            <Text variant="bodyMedium">{dayjs.unix(sessionDetails.startTime).format('DD/MM/YYYY HH:mm')}</Text>
          </Text>
          <Text>
            <Text variant="titleMedium">结束时间: </Text>
            <Text variant="bodyMedium">{dayjs.unix(sessionDetails.endTime).format('DD/MM/YYYY HH:mm')}</Text>
          </Text>
          <Text>
            <Text variant="titleMedium">时长: </Text>
            <Text variant="bodyMedium">{sessionDetails.duration / 60} 分钟</Text>
          </Text>
          <Markdown style={{ padding: 10 }} contentInsetAdjustmentBehavior="automatic" style={theme}>
            {sessionDetails.examPaper.problemStatement}
          </Markdown>
        </Card.Content>
      </Card>
      <View style={{ padding: 42 }}></View>
    </>
  )
}

function AnswerSheet({ sessionDetails, setProgress, progress }) {
  const theme = markedTheme()
  const [submissionCompleteDialogVisible, setSubmissionCompleteDialogVisible] = React.useState(false)
  const [text, setText] = React.useState(progress)
  const [submissionSent, setSubmissionSent] = React.useState(false)
  const [submissionDetails, setSubmissionDetails] = React.useState(null)

  const navigation = useNavigation()

  const timeoutRef = React.useRef(null)

  React.useEffect(() => {
    setProgress(text)
  }, [text])


  React.useEffect(() => {
    // if timeout exists, clear it
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    // set timeout to upload answer after 1 seconds without any input
    timeoutRef.current = setTimeout(() => {
      Remote.updateWritingExamSessionAnswer(sessionDetails.sessionId, text).then(r => {
        if (r.status) {
          console.log('answer uploaded')
        } else {
          setMessage(r.message)
        }
      })
    }, 1000)
    return () => {
      // clear timeout when component unmounts
      clearTimeout(timeoutRef.current)
    }
  }, [text])

  return (
    <>
      <Card style={{ margin: 10, padding: 10 }}>
        <Card.Title title={sessionDetails.examPaper.title} />
        <Card.Content>
          <Text>
            <Text variant="titleMedium">开始时间: </Text>
            <Text variant="bodyMedium">{dayjs.unix(sessionDetails.startTime).format('DD/MM/YYYY HH:mm')}</Text>
          </Text>
          <Text>
            <Text variant="titleMedium">结束时间: </Text>
            <Text variant="bodyMedium">{dayjs.unix(sessionDetails.endTime).format('DD/MM/YYYY HH:mm')}</Text>
          </Text>
          <Text>
            <Text variant="titleMedium">时长: </Text>
            <Text variant="bodyMedium">{sessionDetails.duration / 60} 分钟</Text>
          </Text>
        </Card.Content>
      </Card>

      <Card style={{ margin: 10, padding: 10 }}>
        <Card.Title title={'答题卡'} />
        <Card.Content>
          <TextInput
            label="作文"
            mode="outlined"
            placeholder="在此完成你的作文"
            value={text}
            onChangeText={text => setText(text)}
            multiline={true}
            style={{ height: 200 }}
          />
        </Card.Content>
        <Card.Actions>
          <Button disabled={text.length === 0 || submissionSent} mode="text" onPress={() => {
            // TODO: send answer to server
            setSubmissionSent(true)
            Remote.finalizeWritingExamSession(sessionDetails.sessionId, text).then(r => {
              setSubmissionSent(false)
              if (r.status) {
                console.log('answer submitted', r)
                setSubmissionDetails(r.data)
                setSubmissionCompleteDialogVisible(true)
              } else {
                setMessage(r.message)
              }
            })
          }}>提交并结束考试</Button>
        </Card.Actions>
      </Card>
      <Portal>
        <Dialog
          visible={submissionCompleteDialogVisible}
          onDismiss={() => {
            console.log(submissionDetails)
            setSubmissionCompleteDialogVisible(false)
            navigation.goBack()
          }}
        >
          <Dialog.Title>评测完成。</Dialog.Title>
          <Dialog.Content>
            <Text style={{ marginTop: 10 }}>
              <Text variant="titleMedium">总体得分: </Text>
              <Text variant="bodyMedium">{submissionDetails ? submissionDetails.band : ''}</Text>
            </Text>
            <View style={{ marginBottom: 10 }}>
              <Text variant="titleMedium">反馈: </Text>
              <ScrollView style={{ height: 200 }} contentInsetAdjustmentBehavior="automatic">
                <Markdown style={theme}>
                  {submissionDetails ? submissionDetails.feedback : ''}
                </Markdown>
              </ScrollView>
            </View>
            <Text>
              更多信息请转至测试记录详情页查看。
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => {
              setSubmissionCompleteDialogVisible(false)
              navigation.goBack()
            }}>
              确定
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  )
}

export default function WritingExamParticipation({ navigation, route }) {
  // get session id from route
  const sessionId = route.params.examSession
  const sessionType = route.params.type

  const [session, setSession] = React.useState(null)
  const [message, setMessage] = React.useState(null)
  const [currentPage, setCurrentPage] = React.useState(0)
  const [currentProgress, setCurrentProgress] = React.useState("")

  useFocusEffect(
    React.useCallback(() => {
      Remote.getSessionDetails(sessionType, sessionId).then(r => {
        if (r.status) {
          setSession(r.data)
        } else {
          setMessage(r.message)
        }
      })
    }, [])
  )

  return <>
    <PaperProvider theme={mdTheme()}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={'答题'}></Appbar.Content>
      </Appbar.Header>
      {session === null && <View style={{ width: '100%', flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator animating={true} size="large" style={{ margin: 10 }} />
        <Text>加载中...</Text>
      </View>}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "none"}>
        <ScrollView>
          {(currentPage === 0 && session) && <ProblemStatementPresentation sessionDetails={session}></ProblemStatementPresentation>}
          {(currentPage === 1 && session) && <AnswerSheet sessionDetails={session} progress={currentProgress} setProgress={setCurrentProgress}></AnswerSheet>}
        </ScrollView>
      </KeyboardAvoidingView>
      <Portal>
        <FAB style={{ position: 'absolute', margin: 16, right: 16, bottom: 16 }} icon={currentPage % 2 ? "book" : "pencil"} onPress={() => setCurrentPage((currentPage + 1) % 2)}>
        </FAB>
      </Portal>
    </PaperProvider>
  </>
}