from flask import Flask, request, jsonify, session
from flask_cors import CORS
import random
import time

app = Flask(__name__)
app.secret_key = "your-secret-key"  # Use environment variables in production
CORS(app, supports_credentials=True, origins=["http://localhost:5173"])  # Add frontend origin

# Pre-trained Q-table (should be loaded from a file in real implementation)
Q_TABLE = {
    'Fast-Low-Human': {'easy': 8, 'medium': 5, 'hard': 2},
    'Medium-Medium-Human': {'easy': 5, 'medium': 8, 'hard': 3},
    'Slow-High-Bot': {'easy': -3, 'medium': -5, 'hard': -8},
}

# Helper functions
def get_state(solve_time, retries, mouse_movement):
    """Convert user behavior into a Q-learning state"""
    if solve_time < 3:
        solve_time_category = 'Fast'
    elif solve_time < 10:
        solve_time_category = 'Medium'
    else:
        solve_time_category = 'Slow'

    if retries < 2:
        retries_category = 'Low'
    elif retries < 5:
        retries_category = 'Medium'
    else:
        retries_category = 'High'

    return f"{solve_time_category}-{retries_category}-{mouse_movement}"

def generate_puzzle(difficulty):
    """Generate puzzle data based on difficulty level"""
    sizes = {'easy': 9, 'medium': 16, 'hard': 25}
    size = sizes[difficulty]
    return {
        'missing_index': random.randint(0, size-1),
        # Generate relative paths for images
        'puzzle': [f'static/images/{difficulty}_part{i+1}.jpg' for i in range(size)],
        'difficulty': difficulty
    }

@app.route('/generate_captcha', methods=['GET'])
def generate_captcha():
    """Generate a new CAPTCHA puzzle"""
    difficulty = session.get('next_difficulty', 'easy')
    
    puzzle_data = generate_puzzle(difficulty)
    session['current_puzzle'] = puzzle_data
    session['start_time'] = time.time()
    session['retries'] = 0

    # Prepend full URL to image paths
    images_with_urls = [f"http://localhost:5000/{path}" for path in puzzle_data['puzzle']]
    
    return jsonify({
        'puzzle': images_with_urls,
        'missing_index': puzzle_data['missing_index'],
        'difficulty': difficulty
    })

@app.route('/validate_captcha', methods=['POST'])
def validate_captcha():
    """Validate user's CAPTCHA solution and determine next difficulty"""
    data = request.get_json()
    
    if 'current_puzzle' not in session:
        return jsonify({
            'correct': False,
            'error': 'No active puzzle session'
        }), 400
    
    current_difficulty = session['current_puzzle'].get('difficulty', 'easy')
    correct_index = session['current_puzzle']['missing_index']
    placed_piece_id = data.get('placed_index')
    
    # Check if the piece ID placed is the correct one for the missing spot
    is_correct = str(placed_piece_id) == str(correct_index)
    
    end_time = time.time()
    solve_time = end_time - session.get('start_time', end_time)
    retries = session.get('retries', 0)
    mouse_movement = 'Human'  # Placeholder (implement mouse tracking separately)
    
    # Determine next difficulty based on Q-learning
    current_state = get_state(solve_time, retries, mouse_movement)
    default_q_values = {'easy': 3, 'medium': 2, 'hard': 1}
    available_actions = Q_TABLE.get(current_state, default_q_values)
    
    # If correct answer, progress to next difficulty level
    if is_correct:
        if current_difficulty == 'easy':
            next_difficulty = 'medium'
        elif current_difficulty == 'medium':
            next_difficulty = 'hard'
        else:
            # If already at hard level, use Q-learning to decide
            next_difficulty = max(available_actions, key=available_actions.get)
    else:
        # If incorrect, reload same difficulty or possibly easier one based on Q-learning
        # Increment retries counter
        session['retries'] = retries + 1
        
        # If too many retries, consider going back to an easier level
        if retries >= 2:
            next_difficulty = max(available_actions, key=available_actions.get)
        else:
            next_difficulty = current_difficulty
    
    session['next_difficulty'] = next_difficulty
    
    print(f"Current difficulty: {current_difficulty}, Next difficulty: {next_difficulty}, Correct: {is_correct}, Retries: {retries}")
    
    return jsonify({
        'correct': is_correct,
        'next_difficulty': next_difficulty,
        'current_difficulty': current_difficulty,
        'solve_time': round(solve_time, 2),
        'retries': retries
    })

@app.route('/debug_session', methods=['GET'])
def debug_session():
    session_data = dict(session)
    print("Session data:", session_data)
    return jsonify(session_data)

if __name__ == '__main__':
    app.run(port=5000, debug=True)