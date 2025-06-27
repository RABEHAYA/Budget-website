from flask import Flask, request, jsonify, render_template, redirect, url_for, session

from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename

from models import db, User, Bill, Goal, Task, Reminder, Debt, Category, Expense, Income
from functools import wraps
import os
from flask import Flask

app = Flask(__name__)  # ✅ Define app first

UPLOAD_FOLDER = 'static/img'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER  # ✅ Then use app

app.secret_key = 'your_secret_key'

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
CORS(app)

# ----------------- Helpers -----------------
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login_page'))
        return f(*args, **kwargs)
    return decorated_function

# ----------------- Auth Routes -----------------
@app.route('/signup', methods=['GET'])
def signup_page():
    return render_template('signup.html')


@app.route('/api/signup', methods=['POST'])
def signup_api():
    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')

    if not name or not email or not password:
        return jsonify({'success': False, 'message': 'All fields are required'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'success': False, 'message': 'Email already exists'}), 400

    # Hash the password
    hashed_password = generate_password_hash(password)

    # Create new user
    new_user = User(name=name, email=email, password=hashed_password)
    db.session.add(new_user)
    db.session.flush()  # Gets new_user.id before commit

    # Add default categories with image filenames
    default_categories = [
        {'name': 'Food', 'image_filename': 'food.jpg'},
        {'name': 'Transport', 'image_filename': 'transport.jpg'},
        {'name': 'Gadgets', 'image_filename': 'gadgets.jpg'},
        {'name': 'Clothes', 'image_filename': 'clothes.jpg'},
        {'name': 'Jewelry', 'image_filename': 'jewelry.jpg'},
    ]
    for cat in default_categories:
        db.session.add(Category(
            name=cat['name'],
            image_filename=cat['image_filename'],
            user_id=new_user.id
        ))

    db.session.commit()

    # ✅ Fix: Set session to the new user
    session.clear()
    session['user_id'] = new_user.id
    session['user_name'] = new_user.name

    return jsonify({'success': True, 'message': 'Account created'})





@app.route('/api/login', methods=['POST'])
def login_api():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password, password):
        return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

    # ✅ Store both ID and name in session
    session['user_id'] = user.id
    session['user_name'] = user.name

    

    return jsonify({'success': True, 'user': {'id': user.id, 'name': user.name}}), 200



    # DEBUG print
    print("Email:", email)
    print("Password:", password)
    print("User:", user)
    if user:
        print("Stored hashed password:", user.password)

    if user and check_password_hash(user.password, password):
        session['user_id'] = user.id
        session['user_name'] = user.name
        return jsonify({'message': 'Login successful'}), 200

    print("Login failed!")
    return jsonify({'error': 'Invalid credentials'}), 401


@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login_page'))

# ----------------- API Routes -----------------
# Add bill
@app.route('/api/bills', methods=['POST'])
@login_required
def add_bill():
    data = request.get_json()
    bill = Bill(
        name=data['name'],
        amount=data['amount'],
        date=data['due_date'],
        user_id=session['user_id']
    )
    db.session.add(bill)
    db.session.commit()
    return jsonify({'message': 'Bill added'}), 200

# Delete bill
@app.route('/api/bills/<int:bill_id>', methods=['DELETE'])
@login_required
def delete_bill(bill_id):
    bill = Bill.query.filter_by(id=bill_id, user_id=session['user_id']).first()
    if not bill:
        return jsonify({'error': 'Bill not found'}), 404
    db.session.delete(bill)
    db.session.commit()
    return jsonify({'message': 'Bill deleted'}), 200

@app.route('/api/goals', methods=['POST'])
@login_required
def add_goal():
    data = request.get_json()
    goal = Goal(
        name=data['name'],
        target_amount=data['target'],
        saved_amount=data.get('saved', 0.0),
        user_id=session['user_id']
    )
    db.session.add(goal)
    db.session.commit()
    return jsonify({'message': 'Goal added'}), 200

@app.route('/api/goals', methods=['GET'])
@login_required
def get_goals():
    goals = Goal.query.filter_by(user_id=session['user_id']).all()
    return jsonify([
        {'id': g.id, 'name': g.name, 'target': g.target_amount, 'saved': g.saved_amount}
        for g in goals
    ])

@app.route('/api/goals/<int:goal_id>', methods=['PUT'])
@login_required
def update_goal(goal_id):
    data = request.get_json()
    goal = Goal.query.filter_by(id=goal_id, user_id=session['user_id']).first_or_404()

    if 'saved' in data:
        goal.saved_amount = data['saved']
        db.session.commit()
        return jsonify({'message': 'Goal updated'}), 200
    else:
        return jsonify({'error': 'Missing saved amount'}), 400


@app.route('/api/tasks', methods=['POST'])
@login_required
def add_task():
    data = request.get_json()
    task = Task(description=data['description'], user_id=session['user_id'])
    db.session.add(task)
    db.session.commit()
    return jsonify({'message': 'Task added'}), 200

# POST reminder
@app.route('/api/reminders', methods=['POST'])
@login_required
def add_reminder():
    data = request.get_json()
    reminder = Reminder(
        message=data['text'],
        date=data['date'],
        user_id=session['user_id']
    )
    db.session.add(reminder)
    db.session.commit()
    return jsonify({'message': 'Reminder added'}), 200

# DELETE reminder
@app.route('/api/reminders/<int:reminder_id>', methods=['DELETE'])
@login_required
def delete_reminder(reminder_id):
    reminder = Reminder.query.filter_by(id=reminder_id, user_id=session['user_id']).first()
    if not reminder:
        return jsonify({'error': 'Reminder not found'}), 404
    db.session.delete(reminder)
    db.session.commit()
    return jsonify({'message': 'Reminder deleted'}), 200

@app.route('/api/debts', methods=['POST'])
@login_required
def add_debt():
    data = request.get_json()
    print("Received data for debt:", data)  # ✅ Add this line

    debt = Debt(
        person=data['person'],
        reason=data['reason'],
        date=data['date'],
        amount=data['amount'],
        user_id=session['user_id']
    )
    db.session.add(debt)
    db.session.commit()
    return jsonify({'message': 'Debt added'}), 200


# Get bills
@app.route('/api/bills', methods=['GET'])
@login_required
def get_bills():
    bills = Bill.query.filter_by(user_id=session['user_id']).all()
    return jsonify([
        {'id': b.id, 'name': b.name, 'amount': b.amount, 'due_date': b.date}
        for b in bills
    ])


@app.route('/api/tasks', methods=['GET'])
@login_required
def get_tasks():
    tasks = Task.query.filter_by(user_id=session['user_id']).all()
    return jsonify([
        {'description': t.description}
        for t in tasks
    ])

# GET reminders
@app.route('/api/reminders', methods=['GET'])
@login_required
def get_reminders():
    reminders = Reminder.query.filter_by(user_id=session['user_id']).all()
    return jsonify([
        {'id': r.id, 'text': r.message, 'date': r.date}
        for r in reminders
    ])

@app.route('/api/debts', methods=['GET'])
@login_required
def get_debts():
    debts = Debt.query.filter_by(user_id=session['user_id']).all()
    return jsonify([
        {
            'id': d.id,  # ✅ Needed for deletion
            'person': d.person,
            'reason': d.reason,
            'date': d.date,
            'amount': d.amount
        } for d in debts
    ])


@app.route('/api/debts/<int:debt_id>', methods=['DELETE'])
@login_required
def delete_debt(debt_id):
    debt = Debt.query.filter_by(id=debt_id, user_id=session['user_id']).first()
    if not debt:
        return jsonify({'error': 'Debt not found'}), 404

    db.session.delete(debt)
    db.session.commit()
    return jsonify({'message': 'Debt deleted'}), 200



@app.route('/api/tasks/<int:index>', methods=['DELETE'])
@login_required
def delete_task(index):
    tasks = Task.query.filter_by(user_id=session['user_id']).all()
    if 0 <= index < len(tasks):
        db.session.delete(tasks[index])
        db.session.commit()
        return '', 204
    return 'Not found', 404

@app.route('/api/categories', methods=['POST'])
@login_required
def add_category():
    name = request.form.get('name')
    budget = request.form.get('budget', 0)
    image = request.files.get('image')  # ✅ get the uploaded file

    image_filename = ''
    if image:
        filename = secure_filename(image.filename)
        image_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        image.save(image_path)
        image_filename = filename

    category = Category(
        name=name,
        budget=float(budget),
        image_filename=image_filename,
        user_id=session['user_id']
    )
    db.session.add(category)
    db.session.commit()
    return jsonify({'message': 'Category added'}), 200



@app.route('/api/categories', methods=['GET'])
@login_required
def get_categories():
    categories = Category.query.filter_by(user_id=session['user_id']).all()
    return jsonify([
        {
            'id': c.id,
            'name': c.name,
            'budget': c.budget,
            'image_filename': c.image_filename  # Include this
        }
        for c in categories
    ])


@app.route('/api/expenses', methods=['POST'])
@login_required
def add_expense():
    data = request.get_json()
    expense = Expense(
        description=data['description'],
        amount=data['amount'],
        category=data['category'],
        date=data['date'],
        user_id=session['user_id']
    )
    db.session.add(expense)
    db.session.commit()
    return jsonify({'message': 'Expense added'}), 200

@app.route('/api/expenses', methods=['GET'])
@login_required
def get_expenses():
    expenses = Expense.query.filter_by(user_id=session['user_id']).all()
    return jsonify([
        {
            'id': e.id,
            'description': e.description,
            'amount': e.amount,
            'category': e.category,
            'date': e.date
        } for e in expenses
    ])

@app.route('/api/expenses/<int:expense_id>', methods=['DELETE'])
@login_required
def delete_expense(expense_id):
    expense = Expense.query.filter_by(id=expense_id, user_id=session['user_id']).first()
    if not expense:
        return jsonify({'error': 'Expense not found'}), 404
    db.session.delete(expense)
    db.session.commit()
    return jsonify({'message': 'Deleted'}), 200


@app.route('/api/income', methods=['POST'])
@login_required
def save_income():
    data = request.get_json()
    source = data.get('source')
    amount = data.get('amount')
    date = data.get('date')

    if not source or not amount or not date:
        return jsonify({'error': 'Missing required income fields'}), 400

    existing = Income.query.filter_by(user_id=session['user_id']).first()

    if existing:
        existing.source = source
        existing.amount = amount
        existing.date = date
    else:
        new_income = Income(
            source=source,
            amount=amount,
            date=date,
            user_id=session['user_id']
        )
        db.session.add(new_income)

    db.session.commit()
    return jsonify({'message': 'Income saved'}), 200


@app.route('/api/income', methods=['GET'])
@login_required
def get_income():
    income = Income.query.filter_by(user_id=session['user_id']).first()
    return jsonify({'income': income.amount if income else 0})

# ----------------- Page Routes -----------------
@app.route('/')
def home():
    return render_template('homepage.html')

@app.route('/login')
def login_page():
    return render_template('login.html')



@app.route('/index')
@login_required
def dashboard():
    print("User name in session:", session.get('user_name'))  # ✅ DEBUG print
    return render_template('index.html', user_name=session.get('user_name'))



@app.route('/bills')
@login_required
def bills():
    return render_template('bills.html')

@app.route('/categories')
@login_required
def categories():
    return render_template('categories.html')

@app.route('/goals')
@login_required
def goals():
    return render_template('goals.html')

@app.route('/reports')
@login_required
def reports():
    return render_template('reports.html')

import logging
logging.basicConfig(level=logging.DEBUG)


# ----------------- Run the App -----------------
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)





