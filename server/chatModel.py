import mimetypes
from typing import Any
import typing
import google.generativeai as genai
import google.generativeai.types.content_types
from google.generativeai.types.safety_types import HarmBlockThreshold, HarmCategory
import data.config

import logger

DEFAULT_MODEL_SAFETY_SETTING = {
    HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
}


def Message(role: str, content: str, content_type: str) -> dict[str, str]:
    return {
        'role': role,
        'content': content,
        'content_type': content_type
    }


def AIMessage(content: str) -> dict[str, str]:
    return Message('model', content, 'text')


def HumanMessage(content: str, content_type: str = 'text') -> dict[str, str]:
    return Message('user', content, content_type)


class ChatGoogleGenerativeAI():
    """
    A class for chatting with Google's Generative AI models.


    Attributes:
        model (genai.GenerativeModel): The Generative AI model to use for chatting.
        temperature (float): The temperature to use for generating responses.
        safety_settings (Any): Safety settings for the model.
        system_prompt (str): The system prompt to use for the chat.
        tools (list[typing.Any]): Tools to use for the chat.

    Methods:
        initiate(begin_msg: list[dict[str, str]]) -> str: Initiate the chat session with the beginning message.
        chat(user_msg: list[dict[str, str]]) -> str: Chat with the user message.
    """

    def __init__(self, model: str, temperature: float = 0.9, safety_settings: Any = DEFAULT_MODEL_SAFETY_SETTING, system_prompt: str | None = None, tools: list[typing.Any] = []) -> None:
        self.model: genai.GenerativeModel = genai.GenerativeModel(model_name=model, system_instruction=system_prompt, generation_config={
            'temperature': temperature,
        }, tools=tools)
        self.chat_session: genai.ChatSession | None = None

    def initiate(self, begin_msg: list[dict[str, str]]) -> str:
        if self.chat_session is None:
            self.chat_session = self.model.start_chat(
                enable_automatic_function_calling=True)
        # initiate chat with beginning message
        return self.chat_session.send_message(begin_msg).text

    def chat(self, user_msg: list[dict[str, str]]) -> str:
        if self.chat_session is None:
            raise ValueError(f'{__name__}: Chat session not initiated')
        # chat with user message
        return self.chat_session.send_message(user_msg).text
    
    
def Prompt(prompt: str, args: dict[str, typing.Any]):
    for i in args:
        prompt = prompt.replace('{{' + f'{i}' + '}}', str(args[i]))
    return prompt
    
    
def AnalyzeReadingExamResult(exam_paper: str, correct_ans_count: int, total_ans_count: int, band: int, trouble_problems: list[int], answer_sheet_format: list[dict[str, typing.Any]]) -> str:
    """
    Analyze the reading exam result and generate a report.

    Args:
        exam_paper (str): The exam paper.
        correct_ans_count (int): The number of correct answers.
        total_ans_count (int): The total number of answers.
        band (int): The band score.
        trouble_problems (list[int]): The trouble problems.
        answer_sheet_format (list[dict[str, typing.Any]]): The answer sheet format.

    Returns:
        str: The report.
    """
    prompt = Prompt(data.config.PROMPT_FOR_ANALYZE_READING_EXAM_RESULT, {
        'exam_paper': exam_paper,
        'correct_ans_count': correct_ans_count,
        'total_ans_count': total_ans_count,
        'band': band,
        'trouble_problems': trouble_problems,
        'answer_sheet_format': answer_sheet_format,
    })
    logger.Logger.log(prompt)
    resp = ChatGoogleGenerativeAI('gemini-1.5-flash', 0.7).initiate([prompt])
    # get content from [result][/result]
    final = resp[resp.find('[feedback]') + 10:resp.rfind('[/feedback]')]
    return final


def AnalyzeWritingExamResult(problem_statement: str, one_possible_version: str, compositon: str) -> tuple[str, str]:
    """
    Analyze the writing exam result and generate a report.

    Args:
        problem_statement (str): The problem statement.
        one_possible_version (str): The one possible version.
        composition (str): The composition.

    Returns:
        tuple[str, str]: The band and the report.
    """
    
    prompt = Prompt(data.config.PROMPT_FOR_ANALYZE_WRITING_EXAM_RESULT, {
        'problem_statement': problem_statement,
        'one_possible_version': one_possible_version,
        'composition': compositon,
    })
    logger.Logger.log(prompt)
    resp = ChatGoogleGenerativeAI('gemini-1.5-flash', 0.7).initiate([prompt])
    # get content from [result][/result]
    final = resp[resp.rfind('[feedback]') + 10:resp.rfind('[/feedback]')]
    # get band from [band][/band]
    band = resp[resp.rfind('[band]') + 6:resp.rfind('[/band]')]
    return band, final


def AnalyzeOverallAssessment(reading_feedback: str, writing_feedback: str) -> tuple[str, str]:
    """
    Analyze the overall assessment and generate a report.

    Args:
        reading_feedback (str): The reading feedback.
        writing_feedback (str): The writing feedback.

    Returns:
        tuple[str, str]: The band and the report.
    """
    overall = f"""
    Reading Feedback:
    {reading_feedback}
    
    Writing Feedback:
    {writing_feedback}
    """
    prompt = Prompt(data.config.PROMPT_FOR_ANALYZING_OVERALL_ASSESSMENT, {
       "recent_feedbacks": overall
    })
    logger.Logger.log(prompt)
    resp = ChatGoogleGenerativeAI('gemini-1.5-flash', 0.7).initiate([prompt])
    
    # get content from [result][/result]
    final = resp[resp.find('[feedback]') + 10:resp.rfind('[/feedback]')]
    # get band from [band][/band]
    band = resp[resp.rfind('[band]') + 6:resp.rfind('[/band]')]
    return band, final


def PromptForOralEnglishExamInitiation() -> str:
    return data.config.PROMPT_FOR_ORAL_ENGLISH_EXAM_INITIATION