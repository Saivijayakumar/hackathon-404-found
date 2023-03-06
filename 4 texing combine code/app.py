from flask import Flask, request, jsonify
from flask_cors import CORS
import nltk
import enchant
import speech_recognition as sr
from collections import Counter
import string
import textstat
import spacy

app = Flask(__name__)
CORS(app)

# Download the necessary NLTK resources
nltk.download('punkt')
nltk.download('averaged_perceptron_tagger')

# Initialize the spell-checker dictionary
dictionary = enchant.Dict("en_US")

# Load the English language model for spaCy
nlp = spacy.load("en_core_web_sm")

# global variable to store the sentence
displayed_sentence = "sai"
transcript_Data = ""

@app.route('/convert-audio', methods=['POST'])
def convert_audio():
    global transcript_Data
    audio_file = request.files['audio-file']
    recognizer = sr.Recognizer()
    audio_data = sr.AudioFile(audio_file)
    with audio_data as source:
        audio = recognizer.record(source)
    text = recognizer.recognize_google(audio)
    transcript_Data = text
    return jsonify({'text': text})

@app.route("/check_pronunciation", methods=["POST"])
def check_pronunciation():
    global displayed_sentence
    transcript = request.json["transcript"]
    global transcript_Data
    transcript_Data = transcript

    if transcript.upper() == displayed_sentence.upper():
        success = True
    else:
        success = False

    return jsonify({"success": success})

@app.route("/get_spelling")
def spellingChecker():
    sentence = transcript_Data
    print(transcript_Data)
    words = nltk.word_tokenize(sentence)
    #print(words)
    misspelled_words = []
    vocab_levels = []
    for word in words:
        if not dictionary.check(word) and word not in string.punctuation:
            misspelled_words.append(word)
        else:
            tagged_word = nltk.pos_tag([word])[0]
            vocab_levels.append(tagged_word[1])
    #print(vocab_levels)
    vocab_counts = Counter(vocab_levels)
    total_words = len(vocab_levels)
    results = {"misspelled_words": misspelled_words}
    for level, count in vocab_counts.items():
        #print("inside for loop ")
        if level == 'DT':
            results['Determiners'] = round(count / total_words * 100, 2)
        elif level == 'JJ':
            results['Adjectives'] = round(count / total_words * 100, 2)
        elif level == 'NN':
            results['Nouns'] = round(count / total_words * 100, 2)
        elif level == 'IN':
            results['Prepositions or subordinating conjunctions'] = round(count / total_words * 100, 2)
        elif level == 'CC':
            results['Coordinating conjunctions'] = round(count / total_words * 100, 2)
        elif level == 'NNS':
            results['Plural nouns'] = round(count / total_words * 100, 2)
        elif level == '.':
            results['Punctuation marks'] = round(count / total_words * 100, 2)
        elif level == 'VBP':
            results['Non-3rd person singular present verbs'] = round(count / total_words * 100, 2)
        elif level == 'VBD':
            results['Past tense verbs'] = round(count / total_words * 100, 2)
    return jsonify(results)

@app.route("/sentencescore")
def lexicon_score():

    # Get the Flesch-Kincaid Grade Level of the sentence
    grade_level = textstat.flesch_kincaid_grade(transcript_Data)

    # Tokenize the sentence using spaCy
    doc = nlp(transcript_Data)

    complex_words = []
    complex_phrases = []

    for token in doc:
        
        if textstat.syllable_count(token.text) >= 3:
            complex_words.append(token.text)
        
        if token.dep_ == "ROOT":
            if textstat.text_standard(token.text, float_output=True) >= 10:
                complex_phrases.append(token.text)
    results = {"complex_words": complex_words}
    results['complex_phrases'] = complex_phrases
    results['grade_level'] = grade_level
    return jsonify(results)


if __name__ == "__main__":
    app.run(debug=True)
