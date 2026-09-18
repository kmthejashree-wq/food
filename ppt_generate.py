from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
import textwrap

OUTPUT = r"c:\Users\Thejashree KM\Desktop\food\FoodieHub_Project_Presentation.pdf"

WIDTH, HEIGHT = A4
MARGIN = 18 * mm
TITLE_COLOR = HexColor('#F59E0B')
ACCENT = HexColor('#0F172A')
TEXT = HexColor('#111827')
LIGHT = HexColor('#F8FAFC')
SUBTEXT = HexColor('#475569')
BULLET = HexColor('#F59E0B')

slides = [
    {"title": "FoodieHub", "subtitle": "Mini Project Presentation", "points": ["Smart food ordering and restaurant management system", "Customer-facing menu, cart, checkout, and tracking", "Owner dashboard for order and menu management"], "type": "title"},
    {"title": "Introduction", "subtitle": "What is FoodieHub?", "points": ["FoodieHub is a digital food ordering platform for restaurants and customers.", "Customers can browse dishes, filter menu items, and place orders quickly.", "Restaurant owners can manage orders, menu availability, and sales insights."]},
    {"title": "Problem Statement", "points": ["Traditional ordering systems are often slow and manual.", "Restaurants need a faster way to manage orders and menu updates.", "Customers want a simple and user-friendly ordering experience."]},
    {"title": "Objectives", "points": ["Create a simple online food ordering website.", "Allow customers to search, filter, and order food easily.", "Provide order tracking and checkout flow.", "Enable restaurant owners to update order status and menu availability."]},
    {"title": "Key Features", "points": ["Customer features: menu browsing, sorting, search, cart, checkout, order tracking.", "Admin features: login, dashboard, status updates, menu control, revenue summary.", "Responsive UI for desktop and mobile users.", "Local cart storage and token-based authentication."]},
    {"title": "System Architecture", "points": ["Frontend communicates with backend through REST API requests.", "Customer actions trigger order and menu APIs.", "Admin dashboard fetches analytics, orders, and customer data.", "The system uses frontend logic and backend services to coordinate operations."]},
    {"title": "Customer Flow", "points": ["1. User opens the website and views the menu.", "2. Search and filter dishes with category or diet choice.", "3. Add desired dishes to the cart.", "4. Complete checkout and place the order.", "5. Track order status using the generated order ID."]},
    {"title": "Owner Flow", "points": ["1. Admin logs in to the owner dashboard.", "2. Reviews summary cards for total orders and revenue.", "3. Updates order status from pending to completed.", "4. Manages menu availability and removes menu items.", "5. Monitors customer activity and sales insights."]},
    {"title": "Technologies Used", "points": ["Frontend: HTML, CSS, JavaScript", "Backend: Node.js and Express.js", "Data handling: REST API and local storage", "Design: responsive and modern user interface", "Functionality: event-driven UI and order management logic"]},
    {"title": "Challenges and Learning", "points": ["Managed cart updates and state changes efficiently.", "Handled asynchronous API calls and dynamic UI rendering.", "Built smooth admin controls for status and menu updates.", "Improved full-stack development, debugging, and problem-solving skills."]},
    {"title": "Future Scope", "points": ["Add online payment integration.", "Add secure signup and login management.", "Store data in MongoDB or another database.", "Introduce delivery tracking and notifications.", "Expand into a complete restaurant management system."]},
    {"title": "Conclusion", "points": ["FoodieHub is a practical mini project that combines design, frontend logic, and backend functionality.", "It demonstrates how digital ordering improves customer experience and helps restaurants manage operations efficiently.", "Thank You"]}
]


def draw_background(pdf):
    pdf.setFillColor(LIGHT)
    pdf.rect(0, 0, WIDTH, HEIGHT, fill=1, stroke=0)
    pdf.setFillColor(ACCENT)
    pdf.rect(0, HEIGHT - 18 * mm, WIDTH, 18 * mm, fill=1, stroke=0)


def draw_footer(pdf, page_no):
    pdf.setFillColor(SUBTEXT)
    pdf.setFont('Helvetica', 8)
    pdf.drawRightString(WIDTH - MARGIN, 10 * mm, f"FoodieHub | Slide {page_no}")


def draw_slide(pdf, slide, page_no):
    draw_background(pdf)
    pdf.setFillColor(TITLE_COLOR)
    pdf.setFont('Helvetica-Bold', 24)
    pdf.drawString(MARGIN, HEIGHT - 28 * mm, slide['title'])

    if slide.get('subtitle'):
        pdf.setFillColor(SUBTEXT)
        pdf.setFont('Helvetica', 12)
        pdf.drawString(MARGIN, HEIGHT - 34 * mm, slide['subtitle'])

    pdf.setStrokeColor(HexColor('#E2E8F0'))
    pdf.line(MARGIN, HEIGHT - 40 * mm, WIDTH - MARGIN, HEIGHT - 40 * mm)

    if slide.get('type') == 'title':
        pdf.setFillColor(TEXT)
        pdf.setFont('Helvetica-Bold', 30)
        pdf.drawString(MARGIN, HEIGHT / 2 + 18 * mm, slide['title'])
        pdf.setFont('Helvetica', 16)
        pdf.setFillColor(SUBTEXT)
        pdf.drawString(MARGIN, HEIGHT / 2 - 8 * mm, slide['subtitle'])
        y = HEIGHT / 2 - 35 * mm
        for point in slide['points']:
            pdf.setFillColor(TEXT)
            pdf.setFont('Helvetica', 13)
            pdf.drawString(MARGIN, y, '• ' + point)
            y -= 14 * mm
        draw_footer(pdf, page_no)
        return

    y = HEIGHT - 58 * mm
    for text in slide['points']:
        wrapped = textwrap.wrap(text, width=72)
        for line in wrapped:
            if y < 28 * mm:
                break
            pdf.setFillColor(BULLET)
            pdf.drawString(MARGIN + 6, y, '•')
            pdf.setFillColor(TEXT)
            pdf.drawString(MARGIN + 18, y, line)
            y -= 12 * mm
        y -= 4 * mm

    draw_footer(pdf, page_no)


pdf = canvas.Canvas(OUTPUT, pagesize=A4)
for index, slide in enumerate(slides, start=1):
    draw_slide(pdf, slide, index)
    pdf.showPage()
pdf.save()
print(f"PDF created: {OUTPUT}")
