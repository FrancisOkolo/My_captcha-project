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
    return {
        'missing_index': random.randint(0, sizes[difficulty]-1),
        # Generate relative paths for images
        'images': [f'static/images/{difficulty}_part{i+1}.jpg' for i in range(sizes[difficulty])]
    }

@app.route('/generate_captcha', methods=['GET'])
def generate_captcha():
    """Generate a new CAPTCHA puzzle"""
    difficulty = session.get('next_difficulty', 'easy')
    
    puzzle = generate_puzzle(difficulty)
    print(puzzle)
    session['current_puzzle'] = puzzle
    session['start_time'] = time.time()
    session['retries'] = 0

    # Prepend full URL to image paths
    images_with_urls = [f"http://localhost:5000/{path}" for path in puzzle['images']]
    
    print("Generated Puzzle Data:", {
        'puzzle': images_with_urls,
        'missing_index': puzzle['missing_index'],
        'difficulty': difficulty
    })  # Debugging

    return jsonify({
        'puzzle': images_with_urls,
        'missing_index': puzzle['missing_index'],
        'difficulty': difficulty
    })

@app.route('/validate_captcha', methods=['POST'])
def validate_captcha():
    """Validate user's CAPTCHA solution and determine next difficulty"""
    data = request.get_json()
    
    correct_index = session['current_puzzle']['missing_index']
    is_correct = int(data['placed_index']) == correct_index
    
    end_time = time.time()
    solve_time = end_time - session['start_time']
    retries = session.get('retries', 0)
    mouse_movement = 'Human'  # Placeholder (implement mouse tracking separately)
    
    current_state = get_state(solve_time, retries, mouse_movement)

    available_actions = Q_TABLE.get(current_state, {'easy': 0, 'medium': 0, 'hard': 0})
    next_difficulty = max(available_actions, key=available_actions.get)
    
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
