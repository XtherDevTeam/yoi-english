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
  List
} from 'react-native-paper';
import { Col, Row, Grid } from "react-native-easy-grid";
import dayjs from 'dayjs'
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { KeyboardAvoidingView } from 'react-native';
import { markedTheme, mdTheme } from '../shared/styles';
import Markdown from 'react-native-markdown-display';
import theme from '../shared/theme';
import { is } from '../node_modules/react-native-svg/node_modules/css-select/lib/esm/index';

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
            {sessionDetails.examPaper.passages}
          </Markdown>
        </Card.Content>
      </Card>
    </>
  )
}

function AnswerSheetRow({ currentFormat, index, onUpdateAnswer, currentAnswer }) {
  const [ans, setAns] = React.useState('')
  const [dialogOpen, setDialogOpen] = React.useState(false)

  React.useEffect(() => {
    console.log(currentFormat, 'i fuck you')
  }, [currentFormat])

  React.useEffect(() => {
    setAns(currentAnswer)
  }, [currentAnswer])

  return <View>
    <Portal>
      <Dialog visible={dialogOpen} onDismiss={() => setDialogOpen(false)}>
        <Dialog.Title>请输入答案</Dialog.Title>
        <Dialog.Content>
          {currentFormat.type === 'text' && <TextInput
            value={currentAnswer}
            onChangeText={text => setAns(text)}
            style={{ margin: 10 }}
          />}
          {currentFormat.type === 'choice' && <>
            <List.Section>
              {currentFormat.candidateAnswers.map((answer, i) => (<List.Item key={i} title={ans == answer ? `选中 ${answer}` : answer} onPress={() => {
                setAns(answer)
              }} />))}
            </List.Section>
          </>}
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => {
            setDialogOpen(false)
            onUpdateAnswer(ans, index)
          }}>
            确定
          </Button>
          <Button onPress={() => {
            setDialogOpen(false)
          }}>
            取消
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
    <List.Item
      title={`问题 ${index + 1} 作答`}
      description={currentAnswer ? `当前答案: ${currentAnswer}` : `未作答`}
      onPress={() => {
        setDialogOpen(true)
      }}
    >
    </List.Item>
  </View>
}

function AnswerSheet({ sessionDetails, progress, saveProgress, isVisible }) {
  const theme = markedTheme()
  const [submissionCompleteDialogVisible, setSubmissionCompleteDialogVisible] = React.useState(false)
  const [answers, setAnswers] = React.useState(progress)
  const [submissionSent, setSubmissionSent] = React.useState(false)
  const [submissionDetails, setSubmissionDetails] = React.useState(null)

  const navigation = useNavigation()

  const timeoutRef = React.useRef(null)

  React.useEffect(() => {
    saveProgress(answers)
  }, [answers])

  React.useEffect(() => {
    if (isVisible) {
      console.log('i am visible', progress)
      setAnswers(progress)
    }
  }, [isVisible])

  React.useEffect(() => {
    // if timeout exists, clear it
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    // set timeout to upload answer after 1 seconds without any input
    timeoutRef.current = setTimeout(() => {
      Remote.updateReadingExamSessionAnswer(sessionDetails.sessionId, answers).then(r => {
        if (r.status) {
          console.log('answer uploaded', answers)
        } else {
          console.log('answer upload failed', r)
          setMessage(r.message)
        }
      })
    }, 1000)
    return () => {
      // clear timeout when component unmounts
      clearTimeout(timeoutRef.current)
    }
  }, [answers])

  React.useEffect(() => {
    if (sessionDetails && progress.length === 0) {
      setAnswers(sessionDetails.examPaper.answerSheetFormat.map(() => '')) // create a list made up of '' of length equal to the number of questions
    }
  }, [sessionDetails])

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
          <List.Section>
            {sessionDetails.examPaper.answerSheetFormat.map((format, index) => (
              <AnswerSheetRow key={index} currentFormat={format} index={index} onUpdateAnswer={(answer, index) => {
                const newAnswers = [...answers]
                newAnswers[index] = answer
                setAnswers(newAnswers)
              }} currentAnswer={answers[index]} />
            ))}
          </List.Section>
        </Card.Content>
        <Card.Actions>
          <Button disabled={submissionSent} mode="text" onPress={() => {
            // TODO: send answer to server
            setSubmissionSent(true)
            Remote.finalizeReadingExamSession(sessionDetails.sessionId, answers).then(r => {
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

export default function ReadingExamParticipation({ navigation, route }) {
  // get session id from route
  const sessionId = route.params.examSession
  const sessionType = route.params.type

  const [session, setSession] = React.useState(null)
  const [message, setMessage] = React.useState(null)
  const [currentPage, setCurrentPage] = React.useState(0)

  const [scrollProgressPage1, setScrollProgressPage1] = React.useState(0)
  const [scrollProgressPage2, setScrollProgressPage2] = React.useState(0)
  const [currentProgress, setCurrentProgress] = React.useState("")

  const scrollRef = React.useRef(null)

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

  React.useEffect(() => {
    // restore scroll progress when page is revisited
    if (currentPage === 0) {
      scrollRef.current.scrollTo({ y: scrollProgressPage1, animated: true })
    } else if (currentPage === 1) {
      scrollRef.current.scrollTo({ y: scrollProgressPage2, animated: true })
    }
  }, [currentPage])

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
        <ScrollView ref={scrollRef} onScroll={(e) => {
          // record the progess so that we can restore it when the user comes back to the page
          if (currentPage === 0) {
            setScrollProgressPage1(e.nativeEvent.contentOffset.y)
          } else if (currentPage === 1) {
            setScrollProgressPage2(e.nativeEvent.contentOffset.y)
          }
        }}>
          {(currentPage === 0 && session) && <ProblemStatementPresentation sessionDetails={session} isVisible={currentPage === 0}></ProblemStatementPresentation>}
          {(currentPage === 1 && session) && <AnswerSheet progress={currentProgress} saveProgress={setCurrentProgress} sessionDetails={session} isVisible={currentPage === 1}></AnswerSheet>}
          <View style={{ padding: 42 }}></View>
        </ScrollView>
      </KeyboardAvoidingView>
      <Portal>
        <FAB style={{ position: 'absolute', margin: 16, right: 16, bottom: 16 }} icon={currentPage % 2 ? "book" : "pencil"} onPress={() => setCurrentPage((currentPage + 1) % 2)}>
        </FAB>
      </Portal>
    </PaperProvider>
  </>
}