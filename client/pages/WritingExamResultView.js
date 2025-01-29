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

export default function WritingExamResultView({ navigation, route }) {
  const [loading, setLoading] = React.useState(false);
  const [examResult, setExamResult] = React.useState(null);
  const mkedTheme = markedTheme()
  const theme = mdTheme()

  useFocusEffect(
    React.useCallback(() => {
      setLoading(true);
      Remote.getWritingExamResult(route.params.id).then(result => {
        console.log(result, 'awwwwa');
        if (result.status) {
          setExamResult(result.data);
          setLoading(false);
        }
      }).catch(error => {
        setLoading(false);
      });
    }, [route.params.id])
  );

  return (
    <PaperProvider theme={theme}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="写作测试记录" />
      </Appbar.Header>
      {loading && <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }} variant="">加载中...</Text>

      </View>}
      {(!loading && examResult) && <ScrollView>
        <Card style={{ margin: 10, padding: 10 }}>
          <Card.Title title={'测试记录'} subtitle={examResult.examPaper.title} />
          <Card.Content>
            <Text>
              <Text variant="titleMedium">总体评分：</Text>
              <Text variant="bodyMedium">{examResult.band}</Text>
            </Text>
            <Text>
              <Text variant="titleMedium">完成时间：</Text>
              <Text variant="bodyMedium">{dayjs.unix(examResult.completeTime).format('YYYY-MM-DD HH:mm:ss')}</Text>
            </Text>
            <Text>
              <Text variant="titleMedium">点评与反馈：</Text>
            </Text>
            <Markdown style={{ padding: 10 }} contentInsetAdjustmentBehavior="automatic" style={mkedTheme}>
              {examResult.feedback}
            </Markdown>
          </Card.Content>
        </Card>

        <Card style={{ margin: 10, padding: 10 }}>
          <Card.Title title={'答题详情'} />
          <Card.Content>
            <View style={{ width: '100%' }}>
              <Text variant="titleLarge">
                你的答案：
              </Text>
              <Markdown style={{ padding: 10 }} contentInsetAdjustmentBehavior="automatic" style={mkedTheme}>
                {examResult.answer}
              </Markdown>
            </View>
            <View style={{ width: '100%' }}>
              <Text variant="titleLarge">
                参考范文：
              </Text>
              <Markdown style={{ padding: 10 }} contentInsetAdjustmentBehavior="automatic" style={mkedTheme}>
                {examResult.examPaper.onePossibleVersion}
              </Markdown>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>}
    </PaperProvider>
  );
}