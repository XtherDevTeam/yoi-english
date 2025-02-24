import logger
import json
import dataProvider
import torch
import whisper
import librosa
import numpy as np
from transformers import Wav2Vec2Processor, Wav2Vec2ForCTC, pipeline
from phonemizer import phonemize
from jiwer import wer
import Levenshtein
import pathlib
import io
import wave
import av
import scipy.io.wavfile as wavfile
import typing
import data.config
import chatModel


class PronunciationAssessment:
    def __init__(self, whisper_model_name="small", wav2vec_model_name="facebook/wav2vec2-base-960h"):
        self.whisper_model = pipeline("automatic-speech-recognition", model="openai/whisper-" + whisper_model_name)
        self.wav2vec_processor = Wav2Vec2Processor.from_pretrained(wav2vec_model_name)
        self.wav2vec_model = Wav2Vec2ForCTC.from_pretrained(wav2vec_model_name)

    def transcribe_audio(self, audio_file):
        """Transcribes audio using Whisper."""
        result = self.whisper_model(audio_file, return_timestamps=True)
        return result["text"].strip().lower()

    def get_phonemes(self, text):
        """Converts text to a sequence of phonemes using espeak."""
        return phonemize(text, language='en-us', backend='espeak')

    def extract_audio_features(self, audio_file):
        """Extracts audio features for use with Wav2Vec2."""
        audio, sr = librosa.load(audio_file, sr=16000) # Ensure 16kHz sampling rate
        return audio

    def get_phonemes_from_audio(self, audio_features):
        """Uses Wav2Vec2 to predict phonemes directly from the audio."""
        inputs = self.wav2vec_processor(audio_features, sampling_rate=16000, return_tensors="pt", padding=True)
        with torch.no_grad():
            logits = self.wav2vec_model(**inputs).logits

        predicted_ids = torch.argmax(logits, dim=-1)
        transcription = self.wav2vec_processor.batch_decode(predicted_ids)

        return self.get_phonemes(transcription[0].lower())  # Process it as text

    def calculate_wer(self, reference_text, hypothesis_text):
       return wer(reference_text, hypothesis_text)


    def calculate_edit_distance(self, reference_text, hypothesis_text):
        """Calculates the Levenshtein edit distance between two strings."""
        return Levenshtein.distance(reference_text, hypothesis_text)


    def assess_pronunciation(self, audio_file: str | bytes):
        """Main function for pronunciation assessment."""
        if isinstance(audio_file, str):
            audio_file = pathlib.Path(audio_file).read_bytes()
            
        try:
            reference_text = self.transcribe_audio(audio_file)
            reference_phonemes = self.get_phonemes(reference_text)

            audio_features = self.extract_audio_features(io.BytesIO(audio_file))
            hypothesis_phonemes_audio = self.get_phonemes_from_audio(audio_features)

            #print(f"Whisper Transcribed Text: {reference_text}")
            #print(f"Phonemes (Reference): {reference_phonemes}")
            #print(f"Phonemes (From Audio): {hypothesis_phonemes_audio}")

            # Calculate WER from audio transciption and whisper transcription
            ler_score = self.calculate_edit_distance(reference_phonemes, hypothesis_phonemes_audio)
            similarity = 1 - (ler_score / len(reference_phonemes))
            print(f"LER Score: {ler_score}")
            print(f"Similarity Score: {similarity}")

            return {
                "reference_text": reference_text,
                "reference_phonemes": reference_phonemes,
                "hypothesis_phonemes_audio": hypothesis_phonemes_audio,
                "ler_score": similarity
            }
        except Exception as e:
             print(f"Error during process: {e}")
             raise e


class _Judger:
    def __init__(self):
        self.Assessment = PronunciationAssessment()
        
    
    def evaluate_exam_result(self, llmStateInfo: dict[str, typing.Any]):
        """
        Evaluates the exam result based on the the data generated during exam process.

        Args:
            llmStateInfo (dict[str, typing.Any]): Exam data generated during exam process. All artifacts has been processed and stored in the database.
        """
        
        logger.Logger.log('Evaluation started')
        
        PartI_Answer_Pronunciation_Assessments = []
        for i in llmStateInfo['PartI_Conversation_Answers']:
            logger.Logger.log(f"Evaluating Part I Answer: Artifact ID {i}")
            # extract audio data from database
            wav = dataProvider.DataProvider.getArtifactContentById(i)
            assess = self.Assessment.assess_pronunciation(wav)
            PartI_Answer_Pronunciation_Assessments.append({
                'reference_text': assess['reference_text'],
                'reference_phonemes': assess['reference_phonemes'],
                'examinee_phonemes': assess['hypothesis_phonemes_audio'],
                'score': assess['ler_score']
            })
            
        logger.Logger.log(f'Evaluating Part II Student Statement: Artifact ID {llmStateInfo["PartII_Student_Statement_Answer"]}')
        PartII_Student_Statement_Pronunciation_Assessment = {}
        wav = dataProvider.DataProvider.getArtifactContentById(llmStateInfo['PartII_Student_Statement_Answer'])
        if wav:
            assess = self.Assessment.assess_pronunciation(wav)
            PartII_Student_Statement_Pronunciation_Assessment = {
                'reference_text': assess['reference_text'],
                'reference_phonemes': assess['reference_phonemes'],
                'examinee_phonemes': assess['hypothesis_phonemes_audio'],
                'score': assess['ler_score']
            }
        else:
            PartII_Student_Statement_Pronunciation_Assessment = {
                'reference_text': '',
                'reference_phonemes': '',
                'examinee_phonemes': '',
                'score': 0
            }
        
        PartII_Follow_Up_Answer_Pronunciation_Assessments = []
        for i in llmStateInfo['PartII_Follow_Up_Answers']:
            logger.Logger.log(f"Evaluating Part II Follow Up Answer: Artifact ID {i}")
            # extract audio data from database
            wav = dataProvider.DataProvider.getArtifactContentById(i)
            assess = self.Assessment.assess_pronunciation(wav)
            PartII_Follow_Up_Answer_Pronunciation_Assessments.append({
                'reference_text': assess['reference_text'],
                'reference_phonemes': assess['reference_phonemes'],
                'examinee_phonemes': assess['hypothesis_phonemes_audio'],
                'score': assess['ler_score']
            })
            
            
        PartIII_Discussion_Answer_Pronunciation_Assessments = []
        for i in llmStateInfo['PartIII_Discussion_Answers']:
            logger.Logger.log(f"Evaluating Part III Discussion Answer: Artifact ID {i}")
            # extract audio data from database
            wav = dataProvider.DataProvider.getArtifactContentById(i)
            assess = self.Assessment.assess_pronunciation(wav)
            PartIII_Discussion_Answer_Pronunciation_Assessments.append({
                'reference_text': assess['reference_text'],
                'reference_phonemes': assess['reference_phonemes'],
                'examinee_phonemes': assess['hypothesis_phonemes_audio'],
                'score': assess['ler_score']
            })
            
        
        overall_score = 0
        PartI_Avg = 0
        PartII_Avg = 0
        PartIII_Avg = 0
        
        for i in PartI_Answer_Pronunciation_Assessments:
            PartI_Avg += i['score']
        PartI_Avg = PartI_Avg / len(PartI_Answer_Pronunciation_Assessments) if PartI_Answer_Pronunciation_Assessments else 0
        overall_score += PartI_Avg
        
        PartII_Avg += PartII_Student_Statement_Pronunciation_Assessment['score']
        for i in PartII_Follow_Up_Answer_Pronunciation_Assessments:
            PartII_Avg += i['score']
        PartII_Avg = PartII_Avg / (len(PartII_Follow_Up_Answer_Pronunciation_Assessments) + 1) if PartII_Follow_Up_Answer_Pronunciation_Assessments else 0
        overall_score += PartII_Avg
        
        for i in PartIII_Discussion_Answer_Pronunciation_Assessments:
            PartIII_Avg += i['score']
        PartIII_Avg = PartIII_Avg / len(PartIII_Discussion_Answer_Pronunciation_Assessments) if PartIII_Discussion_Answer_Pronunciation_Assessments else 0
        overall_score += PartIII_Avg
        
        overall_score = overall_score / 3
        
        return {
            'PartI_Answer_Pronunciation_Assessments': PartI_Answer_Pronunciation_Assessments,
            'PartII_Student_Statement_Pronunciation_Assessment': PartII_Student_Statement_Pronunciation_Assessment,
            'PartII_Follow_Up_Answer_Pronunciation_Assessments': PartII_Follow_Up_Answer_Pronunciation_Assessments,
            'PartIII_Discussion_Answer_Pronunciation_Assessments': PartIII_Discussion_Answer_Pronunciation_Assessments,
            'overall_score': overall_score
        }
        
        
        
        
Judger = _Judger()