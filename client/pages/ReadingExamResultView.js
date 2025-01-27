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

export default function ReadingExamResultView({ navigation, route }) {
  const [loading, setLoading] = React.useState(false);
  const [examResult, setExamResult] = React.useState(null);
  const theme = mdTheme();
  const mkedTheme = markedTheme();

  useFocusEffect(
    React.useCallback(() => {
      setLoading(true);
      Remote.getReadingExamResult(route.params.id).then(result => {
        if (result.status) {
          setExamResult(result.data);
          setLoading(false);
        } else {
          setLoading(false);
        }
      }).catch(error => {
        setLoading(false);
      });
    }, [route.params.id])
  );

  React.useEffect(() => {
    console.log(examResult);
  }, [examResult]);

  return (
    <PaperProvider theme={theme}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="写作测试结果" />
      </Appbar.Header>
      {loading && <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }} variant="">加载中...</Text>

      </View>}
      {(!loading && examResult) && <ScrollView style={{ height: '100%', width: '100%' }}>
        <Card style={{ margin: 10, padding: 10 }}>
          <Card.Title title={'测试结果'} subtitle={examResult.examPaper.title} />
          <Card.Content>
            <Text>
              <Text variant="titleMedium">总体评分：</Text>
              <Text variant="bodyMedium">{examResult.band}</Text>
            </Text>
            <Text>
              <Text variant="titleMedium">正确题目总数：</Text>
              <Text variant="bodyMedium">{examResult.correctAnsCount} / {examResult.answerSheet.length}</Text>
            </Text>
            <Text>
              <Text variant="titleMedium">正确率：</Text>
              <Text variant="bodyMedium">{Math.round(examResult.correctAnsCount / examResult.answerSheet.length * 100)}%</Text>
            </Text>
            <Text>
              <Text variant="titleMedium">完成时间：</Text>
              <Text variant="bodyMedium">{dayjs.unix(examResult.completeTime).format('YYYY-MM-DD HH:mm:ss')}</Text>
            </Text>
            <Text>
              <Text variant="titleMedium">反馈：</Text>
            </Text>
            <Markdown style={{ padding: 10 }} contentInsetAdjustmentBehavior="automatic" style={mkedTheme}>
              {examResult.feedback}
            </Markdown>
          </Card.Content>
        </Card>
        <Card style={{ margin: 10, padding: 10 }}>
          <Card.Title title={'答题详情'} />
          <Card.Content>
            <List.Section>
              {examResult.answerSheet.map((answer, index) => <List.Item
                key={index}
                title={`问题 ${index + 1}`}
                description={(answer == examResult.examPaper.answerSheetFormat[index].answer ? `✅ ` : `❌ `) + `正确答案 ${examResult.examPaper.answerSheetFormat[index].answer} （你的答案： ${answer} ）`}
              ></List.Item>)}
            </List.Section>
          </Card.Content>
        </Card>
      </ScrollView>}
    </PaperProvider>
  );
}