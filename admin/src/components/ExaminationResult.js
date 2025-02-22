
import React from "react";
import Api from "../Api";
import * as Mui from "../Components";
import dayjs from "dayjs";
import MonacoEditor from "./MonacoEditor";
import theme from "../theme";
import Markdown from "react-markdown";

function ReadingExaminationPreviewDialog({ examId, onClose }) {
  const [examinationResult, setExaminationResult] = React.useState(null);

  React.useEffect(() => {
    if (examId) {
      Api.getReadingExamResult(examId).then(res => {
        setExaminationResult(res.data);
      });
    } else {
      setExaminationResult(null);
    }
  }, [examId]);

  return <>{examinationResult && <Mui.Dialog open={examinationResult !== null} onClose={() => onClose()}>
    <Mui.DialogTitle>考试结果</Mui.DialogTitle>
    <Mui.DialogContent>
      <Mui.Grid container spacing={1}>
        <Mui.Grid item xs={12}>
          <Mui.Typography variant="body1" style={{ fontWeight: "bold" }}>
            考试：
          </Mui.Typography>
          <Mui.Typography variant="body2">
            {examinationResult.examPaper.title}
          </Mui.Typography>
        </Mui.Grid>
        <Mui.Grid item xs={12} sm={6}>
          <Mui.Typography variant="body1" style={{ fontWeight: "bold" }}>
            完成时间：
          </Mui.Typography>
          <Mui.Typography variant="body2">
            {dayjs.unix(examinationResult.completeTime).format("YYYY-MM-DD HH:mm:ss")}
          </Mui.Typography>
        </Mui.Grid>
        <Mui.Grid item xs={12} sm={6}>
          <Mui.Typography variant="body1" style={{ fontWeight: "bold" }}>
            分数段：
          </Mui.Typography>
          <Mui.Typography variant="body2">
            {examinationResult.band}
          </Mui.Typography>
        </Mui.Grid>
        <Mui.Grid item xs={12} sm={6}>
          <Mui.Typography variant="body1" style={{ fontWeight: "bold" }}>
            正确答案数量：
          </Mui.Typography>
          <Mui.Typography variant="body2">
            {examinationResult.correctAnsCount} / {examinationResult.examPaper.answerSheetFormat.length}
          </Mui.Typography>
        </Mui.Grid>
        <Mui.Grid item xs={12} sm={6}>
          <Mui.Typography variant="body1" style={{ fontWeight: "bold" }}>
            准确率：
          </Mui.Typography>
          <Mui.Typography variant="body2">
            {Math.round(examinationResult.correctAnsCount / examinationResult.examPaper.answerSheetFormat.length * 100)}%
          </Mui.Typography>
        </Mui.Grid>
        <Mui.Grid item xs={12}>
          <Mui.Typography variant="body1" style={{ fontWeight: "bold" }}>
            反馈：
          </Mui.Typography>
          <Markdown>
            {examinationResult.feedback}
          </Markdown>
        </Mui.Grid>
        <Mui.Grid item xs={12}>
          <Mui.Typography variant="body1" style={{ fontWeight: "bold" }}>
            答案详情：
          </Mui.Typography>
          <Mui.List>
            {examinationResult.answerSheet.map((answer, index) => <Mui.ListItem key={index}>
              <Mui.ListItemText primary={`第${index + 1}题`} secondary={((answer == examinationResult.examPaper.answerSheetFormat[index].answer) ? '正确：' : '错误：') + `${answer} (正确答案：${examinationResult.examPaper.answerSheetFormat[index].answer})`} />
            </Mui.ListItem>)}
          </Mui.List>
        </Mui.Grid>
      </Mui.Grid>
    </Mui.DialogContent>
    <Mui.DialogActions>
      <Mui.Button onClick={() => onClose()}>关闭</Mui.Button>
    </Mui.DialogActions>
  </Mui.Dialog>}</>
}

function WritingExaminationPreviewDialog({ examId, onClose }) {
  const [examinationResult, setExaminationResult] = React.useState(null)

  React.useEffect(() => {
    if (examId) {
      Api.getWritingExamResult(examId).then(res => {
        setExaminationResult(res.data);
      });
    } else {
      setExaminationResult(null);
    }
  }, [examId]);

  return <>{examinationResult && <Mui.Dialog open={examinationResult !== null} onClose={() => onClose()}>
    <Mui.DialogTitle>考试结果</Mui.DialogTitle>
    <Mui.DialogContent>
      <Mui.Grid container spacing={1}>
        <Mui.Grid item xs={12}>
          <Mui.Typography variant="body1" style={{ fontWeight: "bold" }}>
            考试：
          </Mui.Typography>
          <Mui.Typography variant="body2">
            {examinationResult.examPaper.title}
          </Mui.Typography>
        </Mui.Grid>
        <Mui.Grid item xs={12} sm={6}>
          <Mui.Typography variant="body1" style={{ fontWeight: "bold" }}>
            完成时间：
          </Mui.Typography>
          <Mui.Typography variant="body2">
            {dayjs.unix(examinationResult.completeTime).format("YYYY-MM-DD HH:mm:ss")}
          </Mui.Typography>
        </Mui.Grid>
        <Mui.Grid item xs={12} sm={6}>
          <Mui.Typography variant="body1" style={{ fontWeight: "bold" }}>
            分数段：
          </Mui.Typography>
          <Mui.Typography variant="body2">
            {examinationResult.band}
          </Mui.Typography>
        </Mui.Grid>
        <Mui.Grid item xs={12}>
          <Mui.Typography variant="body1" style={{ fontWeight: "bold" }}>
            反馈：
          </Mui.Typography>
          <Markdown>
            {examinationResult.feedback}
          </Markdown>
        </Mui.Grid>
        <Mui.Grid item xs={12}>
          <Mui.Typography variant="body1" style={{ fontWeight: "bold" }}>
            答案：
          </Mui.Typography>
          <Markdown>
            {examinationResult.answer}
          </Markdown>
        </Mui.Grid>
        <Mui.Grid item xs={12}>
          <Mui.Typography variant="body1" style={{ fontWeight: "bold" }}>
            参考答案：
          </Mui.Typography>
          <Markdown>
            {examinationResult.examPaper.onePossibleVersion}
          </Markdown>
        </Mui.Grid>
      </Mui.Grid>
    </Mui.DialogContent>
    <Mui.DialogActions>
      <Mui.Button onClick={() => onClose()}>关闭</Mui.Button>
    </Mui.DialogActions>
  </Mui.Dialog>}</>
}

function OralExamintionSectionView({ sectionQuestions, sectionAnswerDetails, sectionAnswers }) {
  return <Mui.Grid container spacing={1} style={{ paddingY: "10px" }}>
    {sectionQuestions.map((question, index) => <Mui.Grid item xs={12} key={index} style={{ padding: '10px' }}>
      <Mui.Typography variant="body1" style={{ fontStyle: "italic" }}>
        {question}
      </Mui.Typography>
      <Mui.Typography variant="body1" style={{ fontWeight: "bold" }}>学生回答：</Mui.Typography>
      <Mui.Typography>
        <audio src={Api.getArtifactDownloadUrl(sectionAnswers[index])} controls></audio>
      </Mui.Typography>
      <Mui.Typography variant="body1" style={{ fontWeight: "bold" }}>发音准确率：</Mui.Typography>
      <Mui.Typography variant="body2">{sectionAnswerDetails[index].score}
      </Mui.Typography>
      <Mui.Typography variant="body1" style={{ fontWeight: "bold" }}>参考文本：</Mui.Typography>
      <Mui.Typography variant="body2">{sectionAnswerDetails[index].reference_text}
      </Mui.Typography>
    </Mui.Grid>)}
  </Mui.Grid>
}

function OralExaminationPreviewDialog({ examId, onClose }) {
  const [examinationResult, setExaminationResult] = React.useState(null)

  React.useEffect(() => {
    if (examId) {
      Api.getOralExamResult(examId).then(res => {
        setExaminationResult(res.data);
      });
    } else {
      setExaminationResult(null);
    }
  }, [examId]);

  return <>{examinationResult && <Mui.Dialog open={examinationResult !== null} onClose={() => onClose()}>
    <Mui.DialogTitle>考试结果</Mui.DialogTitle>
    <Mui.DialogContent>
      <Mui.Grid container spacing={1}>
        <Mui.Grid item xs={12}>
          <Mui.Typography variant="body1" style={{ fontWeight: "bold" }}>
            考试：
          </Mui.Typography>
          <Mui.Typography variant="body2">
            {examinationResult.examPaper.title}
          </Mui.Typography>
        </Mui.Grid>
        <Mui.Grid item xs={12} sm={6}>
          <Mui.Typography variant="body1" style={{ fontWeight: "bold" }}>
            完成时间：
          </Mui.Typography>
          <Mui.Typography variant="body2">
            {dayjs.unix(examinationResult.completeTime).format("YYYY-MM-DD HH:mm:ss")}
          </Mui.Typography>
        </Mui.Grid>
        <Mui.Grid item xs={12} sm={6}>
          <Mui.Typography variant="body1" style={{ fontWeight: "bold" }}>
            得分：
          </Mui.Typography>
          <Mui.Typography variant="body2">
            {examinationResult.band}
          </Mui.Typography>
        </Mui.Grid>
        <Mui.Grid item xs={12}>
          <Mui.Typography variant="body1" style={{ fontWeight: "bold" }}>
            反馈：
          </Mui.Typography>
          <Markdown>
            {examinationResult.overallFeedback}
          </Markdown>
        </Mui.Grid>
        <Mui.Grid item xs={12}>
          <Mui.Typography variant="body1" style={{ fontWeight: "bold" }}>
            Part I 部分学生答案
          </Mui.Typography>
          <OralExamintionSectionView
            sectionAnswerDetails={examinationResult?.answerDetails?.Pronunciation_Evaluation_Result?.PartI_Answer_Pronunciation_Assessments}
            sectionQuestions={examinationResult?.answerDetails?.PartI_Conversation_Questions}
            sectionAnswers={examinationResult?.answerDetails?.PartI_Conversation_Answers} />
        </Mui.Grid>
        <Mui.Grid item xs={12}>
          <Mui.Typography variant="body1" style={{ fontWeight: "bold" }}>
            任务卡
          </Mui.Typography>
          <Markdown>
            {examinationResult.answerDetails?.PartII_Task_Card}
          </Markdown>
          <Mui.Typography variant="body1" style={{ fontWeight: "bold" }}>
            Part II 部分学生陈述
          </Mui.Typography>
          <OralExamintionSectionView
            sectionAnswerDetails={examinationResult?.answerDetails?.PartII_Begin_Word ? [examinationResult?.answerDetails?.Pronunciation_Evaluation_Result?.PartII_Student_Statement_Pronunciation_Assessment] : []}
            sectionQuestions={examinationResult?.answerDetails?.PartII_Begin_Word ? [examinationResult?.answerDetails?.PartII_Begin_Word] : []}
            sectionAnswers={examinationResult?.answerDetails?.PartII_Student_Statement_Answer ? [examinationResult?.answerDetails?.PartII_Student_Statement_Answer] : []} />
          <Mui.Typography variant="body1" style={{ fontWeight: "bold" }}>
            Part II 部分学生追问答案
          </Mui.Typography>
          <OralExamintionSectionView
            sectionAnswerDetails={examinationResult?.answerDetails?.Pronunciation_Evaluation_Result?.PartII_Follow_Up_Answer_Pronunciation_Assessments}
            sectionQuestions={examinationResult?.answerDetails?.PartII_Follow_Up_Questions}
            sectionAnswers={examinationResult?.answerDetails?.PartII_Follow_Up_Answers} />
        </Mui.Grid>
        <Mui.Grid item xs={12}>
          <Mui.Typography variant="body1" style={{ fontWeight: "bold" }}>
            Part III 部分学生答案
          </Mui.Typography>
          <OralExamintionSectionView
            sectionAnswerDetails={examinationResult?.answerDetails?.Pronunciation_Evaluation_Result?.PartIII_Discussion_Answer_Pronunciation_Assessments}
            sectionQuestions={examinationResult?.answerDetails?.PartIII_Discussion_Questions}
            sectionAnswers={examinationResult?.answerDetails?.PartIII_Discussion_Answers} />
        </Mui.Grid>
      </Mui.Grid>
    </Mui.DialogContent>
    <Mui.DialogActions>
      <Mui.Button onClick={() => onClose()}>关闭</Mui.Button>
    </Mui.DialogActions>
  </Mui.Dialog>}</>
}

function ExaminationResultRow({ examinationResult, examType }) {
  const [readingExamPreviewDialogState, setReadingExamPreviewDialogState] = React.useState(null);
  const [writingExamPreviewDialogState, setWritingExamPreviewDialogState] = React.useState(null);
  const [oralExamPreviewDialogState, setOralExamPreviewDialogState] = React.useState(null);

  return <Mui.TableRow>
    <WritingExaminationPreviewDialog examId={writingExamPreviewDialogState} onClose={() => setWritingExamPreviewDialogState(null)} />
    <ReadingExaminationPreviewDialog examId={readingExamPreviewDialogState} onClose={() => setReadingExamPreviewDialogState(null)} />
    <OralExaminationPreviewDialog examId={oralExamPreviewDialogState} onClose={() => setOralExamPreviewDialogState(null)} />
    <Mui.TableCell>{examinationResult.id}</Mui.TableCell>
    <Mui.TableCell>{examinationResult.username}</Mui.TableCell>
    <Mui.TableCell>{examinationResult.examPaper.title}</Mui.TableCell>
    <Mui.TableCell>{examinationResult.band}</Mui.TableCell>
    <Mui.TableCell>{dayjs.unix(examinationResult.completeTime).format("YYYY-MM-DD HH:mm:ss")}</Mui.TableCell>
    <Mui.TableCell>
      <Mui.IconButton color="primary" onClick={() => {
        if (examType === "reading") {
          setReadingExamPreviewDialogState(examinationResult.id);
        } else if (examType === "writing") {
          setWritingExamPreviewDialogState(examinationResult.id);
        } else if (examType === "oral") {
          setOralExamPreviewDialogState(examinationResult.id);
        }
      }}>
        <Mui.Icons.Visibility />
      </Mui.IconButton>
    </Mui.TableCell>
  </Mui.TableRow>
}

export default function ExaminationResult({ }) {
  const [examinationResultList, setExaminationResultList] = React.useState([]);
  const [currentExamType, setCurrentExamType] = React.useState("reading");
  const [filterExamId, setFilterExamId] = React.useState(0);
  const [filterUserId, setFilterUserId] = React.useState(0);
  const [filterAvailableTime, setFilterAvailableTime] = React.useState([dayjs.unix(0), dayjs.unix(0)]);


  React.useEffect(() => {
    if (currentExamType === "reading") {
      Api.getReadingExamResultList().then(res => {
        setExaminationResultList(res.data);
      });
    } else if (currentExamType === "oral") {
      Api.getOralExamResultList().then(res => {
        setExaminationResultList(res.data);
      });
    } else if (currentExamType === "writing") {
      Api.getWritingExamResultList().then(res => {
        setExaminationResultList(res.data);
      });
    }
  }, [currentExamType]);

  return <>
    <Mui.CardContent>
      <Mui.Tabs value={currentExamType} onChange={(e, value) => {
        console.log(e, value)
        setCurrentExamType(value);
      }}>
        <Mui.Tab label="阅读" value={'reading'} />
        <Mui.Tab label="写作" value={'writing'} />
        <Mui.Tab label="听力与口语" value={'oral'} />
      </Mui.Tabs>
      <Mui.Grid container spacing={1}>
        <Mui.Grid item xs={12}>
          <Mui.TableContainer>
            <Mui.Table>
              <Mui.TableHead>
                <Mui.TableRow>
                  <Mui.TableCell>#</Mui.TableCell>
                  <Mui.TableCell>用户名</Mui.TableCell>
                  <Mui.TableCell>考试标题</Mui.TableCell>
                  <Mui.TableCell>分数段</Mui.TableCell>
                  <Mui.TableCell>完成时间</Mui.TableCell>
                  <Mui.TableCell>操作</Mui.TableCell>
                </Mui.TableRow>
              </Mui.TableHead>
              <Mui.TableBody>
                {examinationResultList.map(examinationResult =>
                  <ExaminationResultRow
                    key={examinationResult.id}
                    examinationResult={examinationResult}
                    examType={currentExamType} />)}
              </Mui.TableBody>
            </Mui.Table>
          </Mui.TableContainer>
        </Mui.Grid>
      </Mui.Grid>
    </Mui.CardContent>
  </>
}
