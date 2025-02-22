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
  List,
  Divider,
  IconButton,
  Avatar,
} from 'react-native-paper';
import { Col, Row, Grid } from "react-native-easy-grid";
import dayjs from 'dayjs'
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { KeyboardAvoidingView } from 'react-native';
import { markedTheme, mdTheme } from '../shared/styles';
import Markdown from 'react-native-markdown-display';
import theme from '../shared/theme';
import { Audio } from 'expo-av';


function AudioMessageView({ audioUrl, style }) {
  const [playStatus, setPlayStatus] = React.useState(false)
  const [playbackLength, setPlaybackLength] = React.useState(0)
  const [playbackPosition, setPlaybackPosition] = React.useState(0)
  const [isInitialState, setIsInitialState] = React.useState(true)

  const sound = React.useRef(null)

  React.useEffect(() => {
    if (!isInitialState) {
      (async () => {
        if (sound.current) {
          await sound.current.unloadAsync()
        }
        sound.current = (await Audio.Sound.createAsync({ uri: audioUrl })).sound
        sound.current.setStatusAsync({ shouldPlay: true, isLooping: false })
        sound.current.setOnPlaybackStatusUpdate(status => {
          if (status.didJustFinish) {
            (async () => {
              let s = await sound.current.getStatusAsync()
              s.positionMillis = 0
              await sound.current.setStatusAsync(s)
              await sound.current.pauseAsync()
            })()
          }
          setPlayStatus(status.isPlaying)
          setPlaybackLength(Math.floor(status.durationMillis / 1000))
          setPlaybackPosition(Math.floor(status.positionMillis / 1000))
        })
      })()
      return
    }
  }, [isInitialState])

  React.useState(() => () => {
    console.log('unloading audio')
    sound ? sound.unloadAsync() : null
  }, [])

  return (<View style={{ flexDirection: 'row', alignItems: 'center' }}>
    <IconButton
      icon={playStatus ? 'pause' : 'play'}
      size={20}
      onPress={() => {
        if (isInitialState) {
          setIsInitialState(false)
        } else {
          if (playStatus) {
            sound.current.pauseAsync().then(r => setPlayStatus(false))
          } else {
            sound.current.playAsync().then(r => setPlayStatus(true))
          }
        }
      }}
    />
    {playbackLength === 0 && <Text style={{ marginRight: 10 }}>语音</Text>}
    {playbackLength !== 0 && <Text variant="bodyMedium">{playbackPosition} / {playbackLength} s</Text>}
  </View>)
}


function OralExamintionSectionView({ sectionTitle, sectionQuestions, sectionAnswerDetails, sectionAnswers, sectionTaskCard }) {
  const mkedTheme = markedTheme()

  return <Card style={{ margin: 10 }}>
    <Card.Title title={<Text variant="titleLarge">{sectionTitle}</Text>} />
    <Card.Content>
      {sectionTaskCard && <View style={{ padding: 10 }}>
        <Text variant="titleMedium">任务卡：</Text>
        <Markdown style={mkedTheme}>{sectionTaskCard}</Markdown>
      </View>}
      {sectionQuestions?.map((question, index) => <View style={{ padding: 10 }}>
        <Text variant="titleMedium">{index + 1}. <Text style={{ fontStyle: 'italic' }}>{question}</Text></Text>
        <Text variant="titleMedium">
          学生回答
          <AudioMessageView audioUrl={Remote.getArtifactDownloadUrl(sectionAnswers[index])} />
        </Text>
        <Text variant="titleMedium">
          发音准确率：
          <Text variant='bodyMedium'>
            {Math.round(sectionAnswerDetails[index].score * 100)}%
          </Text>
        </Text>
        <Text variant="titleMedium">
          参考文本：
          <Text variant='bodyMedium'>
            {sectionAnswerDetails[index].reference_text?.substring(0, 200)}{sectionAnswerDetails[index].reference_text.length > 200 ? '...' : ''}
          </Text>
        </Text>
      </View>)}
    </Card.Content>
  </Card>
}

function OralExamResultView({ route, navigation }) {
  const [examResult, setExamResult] = React.useState(null)
  const [message, setMessage] = React.useState(null);
  let theme = mdTheme()
  let mkedTheme = markedTheme()

  useFocusEffect(
    React.useCallback(() => {
      Remote.getOralExamResult(route.params.id).then(r => {
        if (r.status) {
          setExamResult(r.data)
        } else {

        }
      })
    }, [])
  )
  return <View style={{ height: '100%', width: '100%' }}>
    <Appbar.Header>
      <Appbar.BackAction onPress={() => navigation.goBack()} />
      <Appbar.Content title="口语测试结果" />
    </Appbar.Header>
    <ScrollView style={{ flex: 1 }}>
      <Card style={{ margin: 10 }}>
        <Card.Title title={<Text variant="titleLarge">{examResult?.examPaper?.title}</Text>} />
        <Card.Content>
          <Text variant="bodyMedium">
            <Text variant="titleMedium">完成时间：</Text>
            {dayjs.unix(examResult?.completeTime).format('YYYY-MM-DD HH:mm:ss')}
          </Text>
          <Text variant="bodyMedium">
            <Text variant="titleMedium">得分：</Text>
            {examResult?.band}
          </Text>
          <Text variant="bodyMedium">
            <Text variant="titleMedium">反馈与建议</Text>
          </Text>
          <Markdown style={mkedTheme}>{examResult?.overallFeedback}</Markdown>
        </Card.Content>
      </Card>
      <OralExamintionSectionView
        sectionTitle="Part I: 简单对话"
        sectionAnswerDetails={examResult?.answerDetails?.Pronunciation_Evaluation_Result?.PartI_Answer_Pronunciation_Assessments}
        sectionQuestions={examResult?.answerDetails?.PartI_Conversation_Questions}
        sectionAnswers={examResult?.answerDetails?.PartI_Conversation_Answers} />
      <OralExamintionSectionView
        sectionTitle="Part II: 学生陈述"
        sectionTaskCard={examResult?.answerDetails?.PartII_Task_Card}
        sectionAnswerDetails={examResult?.answerDetails?.PartII_Begin_Word ? [examResult?.answerDetails?.Pronunciation_Evaluation_Result?.PartII_Student_Statement_Pronunciation_Assessment] : []}
        sectionQuestions={examResult?.answerDetails?.PartII_Begin_Word ? [examResult?.answerDetails?.PartII_Begin_Word] : []}
        sectionAnswers={examResult?.answerDetails?.PartII_Student_Statement_Answer ? [examResult?.answerDetails?.PartII_Student_Statement_Answer] : []} />
      <OralExamintionSectionView
        sectionTitle="Part II: 追问回答"
        sectionAnswerDetails={examResult?.answerDetails?.Pronunciation_Evaluation_Result?.PartII_Follow_Up_Answer_Pronunciation_Assessments}
        sectionQuestions={examResult?.answerDetails?.PartII_Follow_Up_Questions}
        sectionAnswers={examResult?.answerDetails?.PartII_Follow_Up_Answers} />
      <OralExamintionSectionView
        sectionTitle="Part III: 扩展讨论"
        sectionAnswerDetails={examResult?.answerDetails?.Pronunciation_Evaluation_Result?.PartIII_Discussion_Answer_Pronunciation_Assessments}
        sectionQuestions={examResult?.answerDetails?.PartIII_Discussion_Questions}
        sectionAnswers={examResult?.answerDetails?.PartIII_Discussion_Answers} />
      <Portal>
        {message && <Message state={message} text={message} timeout={3000} onStateChange={(state) => {
          setMessage(null);
        }} />}
      </Portal>
    </ScrollView></View>
}

export default OralExamResultView;