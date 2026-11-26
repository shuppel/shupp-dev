//! The site content the game shows, handed over by the page as JSON
//! (built by `src/lib/atlas/registry.ts` from the Astro content collections).

use bevy::prelude::*;
use serde::Deserialize;

#[derive(Deserialize, Clone, Default)]
pub struct Item {
    pub title: String,
    #[serde(default)]
    pub description: Option<String>,
    pub href: String,
    #[serde(default)]
    pub meta: Option<String>,
}

#[derive(Deserialize, Clone, Default)]
pub struct Destination {
    pub id: String,
    pub name: String,
    pub label: String,
    pub preview: String,
    pub href: String,
    #[serde(default)]
    pub intro: Vec<String>,
    #[serde(default)]
    pub items: Vec<Item>,
}

#[derive(Deserialize, Clone, Default)]
pub struct Attribute {
    pub label: String,
    pub value: i64,
    pub note: String,
}

#[derive(Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct Quest {
    pub title: String,
    pub place: String,
    pub years: String,
    #[serde(default)]
    pub current: bool,
    #[serde(default)]
    pub summary: String,
    #[serde(default)]
    pub feats: Vec<String>,
    #[serde(default)]
    pub tech: Vec<String>,
}

#[derive(Deserialize, Clone, Default)]
pub struct Axis {
    pub label: String,
    pub value: f32,
    pub note: String,
}

#[derive(Deserialize, Clone, Default)]
pub struct KeyItem {
    pub name: String,
    pub from: String,
    pub note: String,
    pub kind: String,
    #[serde(default, rename = "type")]
    pub kind_in_game: String,
    #[serde(default)]
    pub rarity: String,
    #[serde(default)]
    pub year: Option<i64>,
    #[serde(default)]
    pub bonus: String,
}

#[derive(Deserialize, Clone, Default)]
pub struct SkillCard {
    pub name: String,
    pub suit: String,
    #[serde(default)]
    pub mastery: u8,
    #[serde(default)]
    pub feeds: String,
    #[serde(default)]
    pub flavor: String,
}

#[derive(Deserialize, Clone, Default)]
pub struct Gear {
    pub name: String,
    pub uses: i64,
}

#[derive(Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct Inventory {
    #[serde(default)]
    pub key_items: Vec<KeyItem>,
    #[serde(default)]
    pub gear: Vec<Gear>,
}

#[derive(Deserialize, Clone, Default)]
pub struct Training {
    pub title: String,
    pub place: String,
    pub years: String,
}

#[derive(Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct Stats {
    pub name: String,
    pub title: String,
    pub location: String,
    pub level: i64,
    #[serde(default)]
    pub attributes: Vec<Attribute>,
    #[serde(default)]
    pub skills: Vec<String>,
    #[serde(default)]
    pub soft_skills: Vec<String>,
    #[serde(default)]
    pub quest_log: Vec<Quest>,
    #[serde(default)]
    pub radar: Vec<Axis>,
    #[serde(default)]
    pub inventory: Inventory,
    #[serde(default)]
    pub training: Vec<Training>,
    #[serde(default)]
    pub cards: Vec<SkillCard>,
}

#[derive(Deserialize, Clone, Default)]
pub struct Player {
    pub stats: Stats,
}

#[derive(Deserialize, Clone, Default, Resource)]
pub struct Registry {
    #[serde(default)]
    pub destinations: Vec<Destination>,
    #[serde(default)]
    pub player: Player,
}

impl Registry {
    pub fn parse(json: &str) -> Self {
        serde_json::from_str(json).unwrap_or_else(|err| {
            warn!("atlas registry did not parse: {err}");
            Self::default()
        })
    }

    pub fn dest(&self, id: &str) -> Destination {
        self.destinations.iter().find(|d| d.id == id).cloned().unwrap_or_else(|| Destination {
            id: id.into(),
            name: id.into(),
            label: id.into(),
            ..default()
        })
    }
}
