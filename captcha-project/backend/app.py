from flask import Flask, request, jsonify, session
from flask_cors import CORS
import random
import time

app = Flask(__name__)
app.secret_key = "your-secret-key"  # Use environment variables in production
CORS(app, supports_credentials=True)

# Pre-trained Q-table (should be loaded from a file in real implementation)
Q_TABLE = {
    'Fast-Low-Human': {'easy': 8, 'medium': 5, 'hard': 2},
    'Medium-Medium-Human': {'easy': 5, 'medium': 8, 'hard': 3},
    'Slow-High-Bot': {'easy': -3, 'medium': -5, 'hard': -8},
    # Add more states as needed
}

# Helper functions
def get_state(solve_time, retries, mouse_movement):
    """Convert user behavior into a Q-learning state"""
    # Categorize solve time
    if solve_time < 3:
        solve_time_category = 'Fast'
    elif solve_time < 10:
        solve_time_category = 'Medium'
    else:
        solve_time_category = 'Slow'

    # Categorize retries
    if retries < 2:
        retries_category = 'Low'
    elif retries < 5:
        retries_category = 'Medium'
    else:
        retries_category = 'High'

    # Combine into state
    return f"{solve_time_category}-{retries_category}-{mouse_movement}"

def generate_puzzle(difficulty):
    """Generate puzzle data based on difficulty level"""
    sizes = {'easy': 9, 'medium': 16, 'hard': 25}
    return {
        'missing_index': random.randint(0, sizes[difficulty]-1),
        'images': [f'static/images/{difficulty}_part{i+1}.jpg' for i in range(sizes[difficulty])]
    }

# API Endpoints
@app.route('/generate_captcha', methods=['GET'])
def generate_captcha():
    """Generate a new CAPTCHA puzzle"""
    # Get difficulty from session or default to easy
    difficulty = session.get('next_difficulty', 'easy')
    
    # Generate puzzle and store in session
    puzzle = generate_puzzle(difficulty)
    session['current_puzzle'] = puzzle
    session['start_time'] = time.time()
    session['retries'] = 0
    
    return jsonify({
        'puzzle': puzzle['images'],
        'missing_index': puzzle['missing_index'],
        'difficulty': difficulty
    })

@app.route('/validate_captcha', methods=['POST'])
def validate_captcha():
    """Validate user's CAPTCHA solution and determine next difficulty"""
    data = request.get_json()
    
    # Validate solution
    correct_index = session['current_puzzle']['missing_index']
    is_correct = int(data['placed_index']) == correct_index
    
    # Calculate metrics
    end_time = time.time()
    solve_time = end_time - session['start_time']
    retries = session.get('retries', 0)
    mouse_movement = 'Human'  # Placeholder (implement mouse tracking separately)
    
    # Get current state
    current_state = get_state(solve_time, retries, mouse_movement)
    
    # Get best action from Q-table
    available_actions = Q_TABLE.get(current_state, {'easy': 0, 'medium': 0, 'hard': 0})
    next_difficulty = max(available_actions, key=available_actions.get)
    
    # Update session for next CAPTCHA
    session['next_difficulty'] = next_difficulty
    session['retries'] += 1
    
    return jsonify({
        'correct': is_correct,
        'next_difficulty': next_difficulty,
        'solve_time': round(solve_time, 2),
        'retries': retries
    })

if __name__ == '__main__':
    app.run(port=5000, debug=True)
