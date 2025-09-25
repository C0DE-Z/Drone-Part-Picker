'use client';

import React, { useEffect, useState } from 'react';
import AdvancedSettingsComponent from '@/components/AdvancedSettings';
import { AdvancedSettings, defaultAdvancedSettings } from '@/types/advancedSettings';

export default function SettingsPage() {
	const [settings, setSettings] = useState<AdvancedSettings>(defaultAdvancedSettings);
	const [isOpen, setIsOpen] = useState(true);
	const [theme, setTheme] = useState<'light' | 'dark'>('light');

	useEffect(() => {
		// Load saved advanced settings
		try {
			const saved = typeof window !== 'undefined' ? localStorage.getItem('dronepartpicker-advanced-settings') : null;
			if (saved) setSettings(JSON.parse(saved));
		} catch {
			// ignore
		}

		// Detect theme from document class
		if (typeof document !== 'undefined') {
			setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
		}
	}, []);

	useEffect(() => {
		// Persist settings to localStorage
		try {
			if (typeof window !== 'undefined') {
				localStorage.setItem('dronepartpicker-advanced-settings', JSON.stringify(settings));
			}
		} catch {
			// ignore
		}
	}, [settings]);

	return (
		<main className="min-h-screen p-6">
			<h1 className="text-2xl font-bold mb-4">Settings</h1>
			<p className="text-gray-600 mb-6">Tune advanced simulation and system parameters.</p>
			<AdvancedSettingsComponent
				settings={settings}
				onSettingsChange={setSettings}
				isOpen={isOpen}
				onToggle={() => setIsOpen(v => !v)}
				theme={theme}
			/>
		</main>
	);
}

