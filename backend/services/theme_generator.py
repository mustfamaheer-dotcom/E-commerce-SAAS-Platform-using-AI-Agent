# backend/services/theme_generator.py
from typing import Dict, Any

def generate_css_variables(theme: Dict[str, Any]) -> str:
    """
    Generate CSS custom properties (:root block) from a theme dict.
    """
    mode = theme.get("mode", "dark")
    primary = theme.get("primaryColor", "#0ea5e9")
    secondary = theme.get("secondaryColor", "#6366f1")
    accent = theme.get("accentColor", "#10b981")
    bg = theme.get("backgroundDark", "#020617") if mode == "dark" else theme.get("backgroundLight", "#f8fafc")
    surface = theme.get("surfaceDark", "#0f172a") if mode == "dark" else theme.get("surfaceLight", "#ffffff")
    text = theme.get("textDark", "#f8fafc") if mode == "dark" else theme.get("textLight", "#0f172a")
    font = theme.get("fontFamily", "Cairo, sans-serif")

    return f"""
    :root {{
      --brand-primary: {primary};
      --brand-secondary: {secondary};
      --brand-accent: {accent};
      --brand-bg: {bg};
      --brand-surface: {surface};
      --brand-text: {text};
      --brand-font: {font};
    }}
    """.strip()
