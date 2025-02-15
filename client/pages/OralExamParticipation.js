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
  IconButton,
  ActivityIndicator
} from 'react-native-paper';
import {
  TabsProvider,
  Tabs,
  TabScreen,
  useTabIndex,
  useTabNavigation,
} from 'react-native-paper-tabs';
import { Col, Row, Grid } from "react-native-easy-grid";
import dayjs from 'dayjs'
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { markedTheme, mdTheme } from '../shared/styles';
import {
  AudioSession,
  LiveKitRoom,
  useTracks,
  useRoomContext,
  TrackReferenceOrPlaceholder,
  VideoTrack,
  isTrackReference,
  registerGlobals,
  useDataChannel,
} from '@livekit/react-native';
import { Audio } from 'expo-av';
import Svg, { Rect } from 'react-native-svg';
import * as Speech from 'expo-speech';
import Markdown from 'react-native-markdown-display';


function AudioLevelIndicator({ audioLevels, style }) {
  let theme = mdTheme()

  return <View style={style}>
    <Svg height="100" width="100%" style={{
      backgroundColor: theme.colors.surfaceVariant,
    }}>
      {/* draw a line in the center */}
      <Rect x="0" y="50" width="100%" height="1" fill={theme.colors.primary} />
      {audioLevels.map((level, index) => (
        <Rect
          key={index}
          x={index * 8}         // 每个柱子间隔8单位
          y={50 - level * 50}   // 高度基于音量（0~50）
          width="4"
          height={level * 50 * 2}   // 动态高度
          fill={theme.colors.primary}
        />
      ))}
    </Svg>
  </View>
}


function FeedbackDialog({ visible, onClose, feedback }) {
  const theme = mdTheme()
  const mkedTheme = markedTheme()
  return <Portal>
    <Dialog visible={visible} onDismiss={onClose}>
      <Dialog.Title>反馈</Dialog.Title>
      <Dialog.Content>
        <ScrollView style={{ maxHeight: 300, padding: 10 }}>
          <Markdown style={mkedTheme}>
            {feedback}
          </Markdown>
        </ScrollView>
      </Dialog.Content>
      <Dialog.Actions>
        <Button onClick={() => {
          onClose()
        }}>关闭</Button>
      </Dialog.Actions>
    </Dialog>
  </Portal>
}


function RoomView({ }) {
  const room = useRoomContext()
  const navigation = useNavigation()
  const [feedback, setFeedback] = React.useState('')
  const [feedbackDialogVisible, setFeedbackDialogVisible] = React.useState(false)
  const [audioLevels, setAudioLevels] = React.useState([])
  const [interruption, setInterruption] = React.useState(false)
  const [currentStage, setCurrentStage] = React.useState('PartI_Conversation')
  const [taskCard, setTaskCard] = React.useState('')
  const [currentSec, setCurrentSec] = React.useState(0)
  const intervalRef = React.useRef(null)
  const intervalCounter = React.useRef(0)
  const timeoutRef = React.useRef(null)
  let mkedTheme = markedTheme()
  const [stages, setStages] = React.useState({
    'PartI_Conversation': {
      title: '第一部分：简单对话',
      description: '你将会与考官进行简单对话，考官将会提问并回答考生的问题。完成回答后，请点击按钮进入下一问题。',
      allowedTimeLimit: NaN,
      showTaskCard: false,
      showTaskCardAwaiting: false,
      showCountdown: true,
      showInterruptionButton: true,
    },
    'PartII_Await_Task_Card': {
      title: '第二部分：等待任务卡下发',
      description: '第一部分已完成答题。请等待考官下发任务卡。',
      allowedTimeLimit: NaN,
      showTaskCard: false,
      showTaskCardAwaiting: true,
      showCountdown: true,
      showInterruptionButton: true,
    },
    'PartII_Preparation': {
      title: '第二部分：准备阶段',
      description: '你需要根据任务卡在60秒钟内准备一篇长篇个人独白（Monologue），并回答考官提出的几组问题。完成准备后，请点击按钮开始答题。',
      allowedTimeLimit: 60 + 60,
      showTaskCard: true,
      showTaskCardAwaiting: false,
      showCountdown: true,
      showInterruptionButton: true,
    },
    'PartII_Student_Statement': {
      title: '第二部分：学生陈述',
      description: '请在120秒内陈述你准备好的独白。完成回答后，请点击按钮进入提问环节。',
      allowedTimeLimit: 120 + 60,
      showTaskCard: true,
      showTaskCardAwaiting: false,
      showCountdown: true,
      showInterruptionButton: true,
    },
    'PartII_Follow_Up_Questioning': {
      title: '第二部分：追问环节',
      description: '请回答考官提出的追问问题。完成回答后，请点击按钮进入下一问题。',
      allowedTimeLimit: NaN,
      showTaskCard: true,
      showTaskCardAwaiting: false,
      showCountdown: true,
      showInterruptionButton: true,
    },
    'PartIII_Discussion': {
      title: '第三部分：讨论环节',
      description: '考官将会将问题延伸到更加抽象的层面，考生需要对考官的问题结合自己的个人长篇独白与考官深入探讨。完成回答后，请点击按钮进入下一问题。',
      allowedTimeLimit: NaN,
      showTaskCard: true,
      showTaskCardAwaiting: false,
      showCountdown: true,
      showInterruptionButton: true,
    },
    'PartIV_Await_For_Feedback': {
      title: '第四部分：等待反馈',
      description: '你已完成答题，现可等待考官反馈。',
      allowedTimeLimit: NaN,
      showTaskCard: false,
      showTaskCardAwaiting: false,
      showCountdown: false,
      showInterruptionButton: false,
    }
  })

  const { send } = useDataChannel((msg) => {
    const { from, payload, topic } = msg
    console.log('Received message', ' topic: ', topic)
    const data = JSON.parse(new TextDecoder().decode(payload))
    switch (topic) {
      case 'audio_level': {
        db = Math.max(0, (data + 100) / 100) // convert to 0~1 range
        if (audioLevels.length < 50) {
          setAudioLevels([...audioLevels, db])
        } else {
          setAudioLevels([...audioLevels.slice(1), db])
        }
        break;
      }
      case 'control': {
        switch (data.event) {
          case 'next_state': {
            setCurrentStage(data.data)
            setInterruption(false)
            if (data?.task_card) {
              setTaskCard(data.task_card)
            }
            break;
          }
          case 'resume_recording': {
            setInterruption(false)
            break;
          }
          case 'feedback': {
            setCurrentStage('PartIV_Await_For_Feedback')
            setInterruption(false)
            setFeedback(data.data)
            setFeedbackDialogVisible(true)
            break;
          }
        }
        break;
      }
    }
  })

  const emitEvent = (event, data) => {
    let buffer = new TextEncoder().encode(JSON.stringify(data))
    send(buffer, {
      topic: event,
      reliable: true
    })
  }

  React.useEffect(() => {
    // set interval
    console.log(interruption, currentStage)
    if (interruption == false) {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current)
        intervalRef.current = 0
        setCurrentSec(0)
      }
      intervalRef.current = setInterval(() => {
        intervalCounter.current += 1
        setCurrentSec(intervalCounter.current)
      }, 1000)

      if (stages[currentStage].allowedTimeLimit === stages[currentStage].allowedTimeLimit) {
        console.log('set timeout', stages[currentStage].allowedTimeLimit)
        if (timeoutRef.current === null) {
          timeoutRef.current = setTimeout(() => {
            setInterruption(true)
            emitEvent('userManualInterruption', {})
            timeoutRef.current = null
          }, stages[currentStage].allowedTimeLimit * 1000)
        }
      }
    }
  }, [currentStage, interruption])
  return <Grid style={{ height: '100%', width: '100%' }}>
    <Row size={25}>
      <AudioLevelIndicator audioLevels={audioLevels} style={{ alignSelf: 'center', justifyContent: 'center', width: '100%', height: '100%' }} />
    </Row>
    <Row size={75}>
      <View style={{ justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%' }}>
        <View style={{ padding: 10 }}>
          <Text variant="titleLarge" style={{ textAlign: 'center' }}>
            {stages[currentStage].title}
          </Text>
        </View>
        <View style={{ padding: 10 }}>
          <Text variant="bodyMedium" style={{ textAlign: 'center' }}>
            {stages[currentStage].description}
          </Text>
        </View>
        {stages[currentStage].showTaskCard && <Card style={{ width: '90%' }}>
          <Card.Content>
            <ScrollView style={{ maxHeight: 200 }}>
              <Markdown style={mkedTheme}>
                {taskCard}
              </Markdown>
            </ScrollView>
          </Card.Content>
        </Card>}
        {stages[currentStage].showTaskCardAwaiting && <Card style={{ width: '90%', justifyContent: 'center', alignItems: 'center' }}>
          <Card.Content>
            <ActivityIndicator animating={true} size="large" />
            <Text style={{ paddingTop: 10 }} variant="bodyMedium">
              等待任务卡下发...
            </Text>
          </Card.Content>
        </Card>}
        {stages[currentStage].showInterruptionButton && <View style={{ padding: 10 }}>
          <IconButton icon="pause" size={50} mode="contained" disabled={interruption} onPress={() => {
            setInterruption(true)
            emitEvent('userManualInterruption', {})
            // clear timeout
            if (timeoutRef.current !== null) {
              clearTimeout(timeoutRef.current)
              timeoutRef.current = null
            }
            // clear interval
            if (intervalRef.current !== null) {
              clearInterval(intervalRef.current)
              intervalRef.current = null
              setCurrentSec(0)
              intervalCounter.current = 0
            }
          }}>
          </IconButton>
        </View>}
        {stages[currentStage].showCountdown && <View style={{ padding: 10 }}>
          <Text variant="bodyLarge">
            时限：{currentSec} / {stages[currentStage].allowedTimeLimit !== NaN ? stages[currentStage].allowedTimeLimit : '∞'} 秒
          </Text>
        </View>}
      </View>
      <FeedbackDialog visible={feedbackDialogVisible} onClose={() => {
        console.log('close feedback dialog')
        navigation.goBack()
        setFeedbackDialogVisible(false)
      }} feedback={feedback} />
    </Row>
  </Grid >
}


export default function OralExamParticipation({ navigation, route }) {
  const [session, setSession] = React.useState(null)
  const [sessionDetails, setSessionDetails] = React.useState(null)
  const [message, setMessage] = React.useState(null)
  const [permissionGranted, setPermissionGranted] = React.useState(false)
  const [audioLevel, setAudioLevel] = React.useState(0)
  const [room, setRoom] = React.useState(null)
  const [connected, setConnected] = React.useState(false)

  useFocusEffect(
    React.useCallback(() => {
      console.log(route.params.examSession, session, setSession)
      setSession(route.params.examSession);
      (async () => {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          setMessage('麦克风权限未授予，无法开始考试。')
        } else {
          setPermissionGranted(true)
        }
      })();
      let start = async () => {
        await AudioSession.startAudioSession();
      };

      start();
      return () => {
        AudioSession.stopAudioSession();
      };
    }, [])
  )
  React.useEffect(() => {
    if (session && permissionGranted) {
      Remote.getSessionDetails('oral', session).then(res => {
        console.log(res)
        setSessionDetails(res.data)
      })
    }
  }, [session, permissionGranted])

  return <>
    <Appbar.Header>
      <Appbar.BackAction onPress={() => {
        setMessage('当前口语测试不允许退出。')
      }} />
      <Appbar.Content title="口语测试答题" />
    </Appbar.Header>
    {(permissionGranted && sessionDetails) && <LiveKitRoom
      serverUrl={`wss://${sessionDetails.livekitEndpoint}`}
      token={sessionDetails.userToken}
      connect={true}
      audio={true}
      onConnected={() => {
        console.log('room connected')
        setConnected(true)
      }}
      onDisconnected={() => {
        console.log('room disconnected')
        setConnected(false)
      }}
      style={{ height: '100%', width: '100%' }}
    >
      {connected && <RoomView />}</LiveKitRoom>}
    {!permissionGranted &&
      <Grid style={{ height: '100%', width: '100%' }}>
        <View style={{ alignSelf: 'center', justifyContent: 'center', width: '100%', alignContent: 'center', alignItems: 'center' }}>
          <Text variant="bodyLarge" style={{ padding: 20, alignSelf: 'center', justifyContent: 'center', textAlign: 'center' }}>
            未获取麦克风权限，无法开始考试。
          </Text>
          <Button
            mode="contained"
            onPress={() => {
              (async () => {
                const { status } = await Audio.requestPermissionsAsync();
                if (status !== 'granted') {
                  setMessage('麦克风权限未授予，无法开始考试。')
                } else {
                  setPermissionGranted(true)
                }
              })();
            }}
          >
            授予麦克风权限
          </Button>
        </View>
      </Grid>
    }
    {message && <Message state={message} text={message} timeout={3000} onStateChange={(state) => {
      setMessage(null);
    }} />}
  </>
}