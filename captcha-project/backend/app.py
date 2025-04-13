from flask import Flask, request, jsonify, session
from flask_cors import CORS
import random

app = Flask(__name__)
app.secret_key = "your-secret-key"  # Use env vars in production
CORS(app, supports_credentials=True)

# Pre-trained Q-table (simplified)
Q_TABLE = {
    'Fast-Low-Human': {'easy': 8, 'medium': 5, 'hard': 2},
    'Slow-High-Bot': {'easy': -3, 'medium': -5, 'hard': -8},
}

def generate_puzzle(difficulty):
    sizes = {'easy': 9, 'medium': 16, 'hard': 25}
    return {
        'missing_index': random.randint(0, sizes[difficulty]-1),
        'images': [f'static/images/{difficulty}_part{i+1}.jpg' for i in range(sizes[difficulty])]
    }

@app.route('/generate_captcha', methods=['GET'])
def generate_captcha():
    difficulty = session.get('next_difficulty', 'easy')
    puzzle = generate_puzzle(difficulty)
    session['current_puzzle'] = puzzle
    session['start_time'] = time.time()
    session['retries'] = 0
    return jsonify({
        'puzzle': puzzle['images'],
        'missing_index': puzzle['missing_index']
    })

@app.route('/validate_captcha', methods=['POST'])
def validate_captcha():
    data = request.get_json()
    correct_index = session['current_puzzle']['missing_index']
    is_correct = int(data['placed_index']) == correct_index
    
    # Update difficulty for next session (simplified)
    session['next_difficulty'] = 'medium' if is_correct else 'easy'
    
    return jsonify({
        'correct': is_correct,
        'next_difficulty': session['next_difficulty']
    })

if __name__ == '__main__':
    app.run(port=5000, debug=True)

